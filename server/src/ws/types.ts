export interface LobbyPlayer {
  playerId: string;       // connId (sessionId from URL) — used for WebSocket lookup
  databaseId: string;     // original player database ID — used for DB operations
  sessionId: string;
  displayName: string;
  characterType: string;
  mapId: string;
}

export interface GameTaskData {
  id: string;
  type: string;
  cropType?: string;
  targetAmount: number;
  currentAmount: number;
  timeLimit: number;
  scoreReward: number;
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  completionTime: number;
  rewardType?: string;
}

export type ClientMessage =
  | { type: 'join_lobby'; playerId: string; sessionId: string; displayName: string; characterType: string; mapId: string }
  | { type: 'player_ready'; playerId: string }
  | { type: 'game_complete'; playerId: string; score: number; completionTime: number };

export type ServerMessage =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | { type: 'game_start'; instanceId: string; mapId: string; tasks: GameTaskData[] }
  | { type: 'player_completed'; displayName: string; rank: number; score: number }
  | { type: 'game_finished'; leaderboard: LeaderboardEntry[]; yourRank: number }
  | { type: 'error'; message: string };

export type AdminMessage =
  | { type: 'admin_start_game'; mapId: string; adminToken: string }  // Deprecated: games auto-start
  | { type: 'admin_end_game'; adminToken: string };

export type AdminBroadcast =
  | { type: 'lobby_update'; players: LobbyPlayer[]; count: number }
  | { type: 'player_joined'; displayName: string; characterType: string; mapId: string }
  | { type: 'player_left'; displayName: string }
  | { type: 'game_started'; instanceId: string }
  | { type: 'leaderboard_update'; entries: LeaderboardEntry[] }
  | { type: 'game_finished'; leaderboard: LeaderboardEntry[] };
