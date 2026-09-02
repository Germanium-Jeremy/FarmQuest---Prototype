<<<<<<< HEAD
export interface LobbyPlayer {
  playerId: string;
  sessionId: string;
  displayName: string;
  characterType: string;
  mapId: string;
}

export interface GameTaskData {
=======
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
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  id: string;
  type: string;
  cropType?: string;
  targetAmount: number;
  currentAmount: number;
  timeLimit: number;
  scoreReward: number;
  description: string;
}

<<<<<<< HEAD
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  completionTime: number;
  rewardType?: string;
}

// Client → Server
export type ClientMessage =
  | { type: 'join_lobby'; playerId: string; sessionId: string; displayName: string; characterType: string; mapId: string }
  | { type: 'player_ready'; playerId: string }
  | { type: 'game_complete'; playerId: string; score: number; completionTime: number };

// Server → Client
export type ServerMessage =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | { type: 'game_start'; instanceId: string; tasks: GameTaskData[] }
  | { type: 'player_completed'; displayName: string; rank: number; score: number }
  | { type: 'game_finished'; leaderboard: LeaderboardEntry[]; yourRank: number }
  | { type: 'error'; message: string };

// Admin → Server
export type AdminMessage =
  | { type: 'admin_start_game'; mapId: string; adminToken: string }
  | { type: 'admin_end_game'; adminToken: string };

// Server → Admin
export type AdminBroadcast =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | { type: 'player_joined'; displayName: string; characterType: string; mapId: string }
=======
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
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  | { type: 'player_left'; displayName: string }
  | { type: 'game_started'; instanceId: string }
  | { type: 'leaderboard_update'; entries: LeaderboardEntry[] }
  | { type: 'game_finished'; leaderboard: LeaderboardEntry[] };
