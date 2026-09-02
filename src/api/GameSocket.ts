import { CharacterType } from '../data/CharacterOptions';
import { MapId } from '../data/MapOptions';
import { ChallengeGenerator } from '../game/ChallengeGenerator';
import { GameTask } from '../game/GameTask';

export interface LobbyPlayer {
  playerId: string;
  displayName: string;
  characterType: CharacterType;
  mapId: MapId;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  characterType: CharacterType;
  score: number;
  completionTime: number;
  rank: number;
}

export interface GameStartMessage {
  type: 'game_start';
  tasks: GameTask[];
}

export interface LobbyUpdateMessage {
  type: 'lobby_update';
  playerCount: number;
  players: LobbyPlayer[];
  status: 'waiting' | 'playing' | 'ended';
  elapsedSeconds?: number;
}

export interface LeaderboardMessage {
  type: 'leaderboard';
  entries: LeaderboardEntry[];
}

type MessageHandler = (data: Record<string, unknown>) => void;

interface LocalEventState {
  players: LobbyPlayer[];
  status: 'waiting' | 'playing' | 'ended';
  tasks: GameTask[] | null;
  results: Array<Omit<LeaderboardEntry, 'rank'>>;
  startedAt: number | null;
}

const LOCAL_KEY = 'farmquest.eventState';
const CHANNEL_NAME = 'farmquest-event';

const emptyState = (): LocalEventState => ({
  players: [],
  status: 'waiting',
  tasks: null,
  results: [],
  startedAt: null,
});

const rankResults = (results: Array<Omit<LeaderboardEntry, 'rank'>>): LeaderboardEntry[] =>
  [...results]
    .sort((a, b) => b.score - a.score || a.completionTime - b.completionTime)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

export class GameSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, MessageHandler>();
  private sessionId = '';
  private clientId = crypto.randomUUID();
  private usingLocal = false;
  private localChannel: BroadcastChannel | null = null;
  private joinPayload: { playerId: string; displayName: string; characterType: string; mapId: string } | null = null;
  private isAdmin = false;
  private adminToken = '';
  private connectTimer: number | null = null;

  connect(sessionId: string): void {
    this.sessionId = sessionId;
    this.isAdmin = false;
    this.useLocalBus();
    this.openSocket(`${this.wsBase()}/ws?sessionId=${encodeURIComponent(sessionId)}`);
  }

  connectAdmin(token: string): void {
    this.isAdmin = true;
    this.adminToken = token;
    this.useLocalBus();
    this.openSocket(`${this.wsBase()}/ws?admin=true&token=${encodeURIComponent(token)}`);
  }

  on(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  send(message: object): void {
    const payload = message as Record<string, unknown>;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
    this.handleLocalSend(payload);
  }

  joinLobby(playerId: string, displayName: string, characterType: string, mapId: string): void {
    this.joinPayload = { playerId, displayName, characterType, mapId };
    this.send({ type: 'join_lobby', playerId, displayName, characterType, mapId });
  }

  playerReady(): void {
    this.send({ type: 'player_ready' });
  }

  gameComplete(score: number, completionTime: number): void {
    this.send({ type: 'game_complete', score, completionTime });
  }

  startGame(): void {
    this.send({ type: 'start_game' });
  }

  endGame(): void {
    this.send({ type: 'end_game' });
  }

  disconnect(): void {
    if (this.connectTimer) window.clearTimeout(this.connectTimer);
    this.connectTimer = null;
    this.ws?.close();
    this.ws = null;
    this.localChannel?.close();
    this.localChannel = null;
    this.usingLocal = false;
  }

  private wsBase(): string {
    const configured = import.meta.env.VITE_WS_URL as string | undefined;
    if (configured) return configured.replace(/\/$/, '');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  private openSocket(url: string): void {
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.useLocalBus();
      return;
    }

    let opened = false;
    this.ws.onopen = () => {
      opened = true;
      if (this.isAdmin) this.ws?.send(JSON.stringify({ type: 'admin_auth', token: this.adminToken }));
      if (this.joinPayload) this.ws?.send(JSON.stringify({ type: 'join_lobby', ...this.joinPayload }));
      this.emit('connected', { local: false });
    };
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as Record<string, unknown>;
        this.dispatch(message);
      } catch (error) {
        console.error(error);
      }
    };
    this.ws.onclose = () => {
      if (!opened) this.useLocalBus();
    };
    this.ws.onerror = () => {
      if (!opened) this.useLocalBus();
    };

    if (this.connectTimer) window.clearTimeout(this.connectTimer);
    this.connectTimer = window.setTimeout(() => {
      if (!opened) this.useLocalBus();
    }, 700);
  }

  private useLocalBus(): void {
    const alreadyReady = this.usingLocal && this.localChannel != null;
    this.usingLocal = true;
    if (!this.localChannel) {
      this.localChannel = new BroadcastChannel(CHANNEL_NAME);
      this.localChannel.onmessage = (event) => {
        const message = event.data as Record<string, unknown>;
        if (message.senderId === this.clientId) return;
        this.dispatch(message);
      };
      window.addEventListener('storage', (event) => {
        if (event.key !== LOCAL_KEY) return;
        this.emitState();
      });
    }
    if (alreadyReady) return;
    this.emit('connected', { local: true });
    if (this.joinPayload) this.handleLocalSend({ type: 'join_lobby', ...this.joinPayload });
    else this.emitState();
  }

  private handleLocalSend(message: Record<string, unknown>): void {
    const state = this.readState();
    const type = String(message.type ?? '');

    if (type === 'join_lobby') {
      const player: LobbyPlayer = {
        playerId: String(message.playerId ?? ''),
        displayName: String(message.displayName ?? 'Player'),
        characterType: (message.characterType as CharacterType) ?? 'male',
        mapId: (message.mapId as MapId) ?? 'rwanda',
      };
      state.players = [...state.players.filter((item) => item.playerId !== player.playerId), player];
      this.writeState(state);
      this.emitState();
      if (state.status === 'playing' && state.tasks) {
        this.dispatch({ type: 'game_start', tasks: state.tasks });
      } else if (state.status === 'ended') {
        this.dispatch({ type: 'leaderboard', entries: rankResults(state.results) });
      }
      return;
    }

    if (type === 'start_game' || type === 'admin_start') {
      state.status = 'playing';
      state.tasks = new ChallengeGenerator().generate(2);
      state.results = [];
      state.startedAt = Date.now();
      this.writeState(state);
      this.broadcast({ type: 'game_start', tasks: state.tasks });
      this.dispatch({ type: 'game_start', tasks: state.tasks });
      this.emitState();
      return;
    }

    if (type === 'end_game' || type === 'admin_end') {
      state.status = 'ended';
      this.writeState(state);
      const entries = rankResults(state.results);
      this.broadcast({ type: 'game_end', entries });
      this.broadcast({ type: 'leaderboard', entries });
      this.dispatch({ type: 'game_end', entries });
      this.dispatch({ type: 'leaderboard', entries });
      this.emitState();
      return;
    }

    if (type === 'game_complete') {
      const playerId = this.joinPayload?.playerId ?? String(message.playerId ?? this.clientId);
      const player = state.players.find((item) => item.playerId === playerId);
      const result = {
        playerId,
        displayName: player?.displayName ?? this.joinPayload?.displayName ?? 'Player',
        characterType: player?.characterType ?? (this.joinPayload?.characterType as CharacterType) ?? 'male',
        score: Number(message.score ?? 0),
        completionTime: Number(message.completionTime ?? 0),
      };
      state.results = [...state.results.filter((item) => item.playerId !== playerId), result];
      this.writeState(state);
      const entries = rankResults(state.results);
      this.broadcast({ type: 'leaderboard', entries });
      this.dispatch({ type: 'leaderboard', entries });
      this.emitState();
    }
  }

  private emitState(): void {
    const state = this.readState();
    const elapsedSeconds = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
    this.dispatch({
      type: 'lobby_update',
      playerCount: state.players.length,
      players: state.players,
      status: state.status,
      elapsedSeconds,
    });
  }

  private readState(): LocalEventState {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return emptyState();
      return { ...emptyState(), ...JSON.parse(raw) as LocalEventState };
    } catch {
      return emptyState();
    }
  }

  private writeState(state: LocalEventState): void {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  }

  private broadcast(message: Record<string, unknown>): void {
    this.localChannel?.postMessage({ ...message, senderId: this.clientId });
  }

  private dispatch(message: Record<string, unknown>): void {
    const type = String(message.type ?? '');
    this.handlers.get(type)?.(message);
  }

  private emit(type: string, data: Record<string, unknown>): void {
    this.handlers.get(type)?.(data);
  }
}
