// ── Lobby player info ───────────────────────────────────────────
export interface LobbyPlayer {
  playerId: string;
  displayName: string;
  characterType: string;
  mapId: string;
  ready: boolean;
}

// ── Task type (sent to clients) ─────────────────────────────────
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

// ── Leaderboard entry ───────────────────────────────────────────
export interface LeaderboardEntry {
  playerId?: string;
  rank: number;
  displayName: string;
  score: number;
  completionTime: number | null;
  rewardType: string | null;
}

// ── Client → Server ─────────────────────────────────────────────
export type ClientMessage =
  | {
      type: 'join_lobby';
      playerId: string;
      sessionId: string;
      displayName: string;
      characterType: string;
      mapId: string;
    }
  | { type: 'player_ready'; playerId: string }
  | {
      type: 'game_complete';
      playerId: string;
      score: number;
      completionTime: number;
    };

// ── Server → Client ─────────────────────────────────────────────
export type ServerMessage =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | { type: 'game_start'; instanceId: string; tasks: GameTask[] }
  | {
      type: 'player_completed';
      displayName: string;
      rank: number;
      score: number;
    }
  | {
      type: 'game_finished';
      leaderboard: LeaderboardEntry[];
      yourRank: number | null;
    }
  | { type: 'error'; message: string };

// ── Admin → Server ──────────────────────────────────────────────
export type AdminMessage =
  | { type: 'admin_start_game'; mapId: string }
  | { type: 'admin_end_game' };

// ── Server → Admin ──────────────────────────────────────────────
export type AdminBroadcast =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | {
      type: 'player_joined';
      displayName: string;
      characterType: string;
      mapId: string;
    }
  | { type: 'player_left'; displayName: string }
  | { type: 'game_started'; instanceId: string }
  | { type: 'leaderboard_update'; entries: LeaderboardEntry[] }
  | { type: 'game_finished'; leaderboard: LeaderboardEntry[] };
