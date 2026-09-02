export interface LobbyPlayer {
  playerId: string;
  displayName: string;
  characterType: string;
  mapId: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  completionTime: number;
  rewardType?: string;
}

export interface GameTask {
  id: string;
  type: string;
  cropType?: string;
  targetAmount: number;
  currentAmount: number;
  timeLimit: number;
  scoreReward: number;
  description: string;
}

export type ServerMessage =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | { type: 'game_start'; instanceId: string; tasks: GameTask[] }
  | { type: 'player_completed'; displayName: string; rank: number; score: number }
  | { type: 'game_finished'; leaderboard: LeaderboardEntry[]; yourRank: number }
  | { type: 'error'; message: string };

export class GameSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, (data: unknown) => void>();
  private connected = false;

  connect(sessionId: string): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?sessionId=${sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected = true;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        const handler = this.handlers.get(message.type);
        handler?.(message);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
    };

    this.ws.onerror = () => {
      this.connected = false;
    };
  }

  on(type: string, handler: (data: unknown) => void): void {
    this.handlers.set(type, handler);
  }

  off(type: string): void {
    this.handlers.delete(type);
  }

  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  joinLobby(playerId: string, displayName: string, characterType: string, mapId: string): void {
    this.send({ type: 'join_lobby', playerId, displayName, characterType, mapId });
  }

  playerReady(playerId: string): void {
    this.send({ type: 'player_ready', playerId });
  }

  gameComplete(playerId: string, score: number, completionTime: number): void {
    this.send({ type: 'game_complete', playerId, score, completionTime });
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }
}
