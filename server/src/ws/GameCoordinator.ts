import { randomUUID } from 'node:crypto';
<<<<<<< HEAD
import { GameTaskData, LeaderboardEntry, LobbyPlayer } from './types.js';

type GameStatus = 'WAITING' | 'IN_PLAY' | 'FINISHED';
=======
import {
  createInstance,
  createSession,
  updateInstanceStatus,
  registerPlayerForInstance,
  updateInstancePlayerStatus,
  insertLeaderboardEntry,
} from '../storage/database.js';
import type { EventInstanceRow } from '../types/index.js';
import type { LobbyPlayer, GameTask, LeaderboardEntry } from './types.js';
import type { SocketManager, PlayerConnection } from './SocketManager.js';
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7

const REWARD_TYPES = [
  'Grand Prize - Premium Gift Basket',
  '2nd Place - Restaurant Voucher',
  '3rd Place - Coffee Shop Gift Card',
  '4th Place - Grocery Store Coupon',
  '5th Place - Movie Tickets',
  '6th Place - Free Coffee Bundle',
  '7th Place - FarmQuest Merchandise',
  '8th Place - Snack Pack',
  '9th Place - Free Parking Voucher',
  '10th Place - FarmQuest Sticker Pack',
];

<<<<<<< HEAD
const randomInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

export class GameCoordinator {
  private lobby: Map<string, LobbyPlayer> = new Map();
  private status: GameStatus = 'WAITING';
  private currentInstanceId: string | null = null;
  private currentTasks: GameTaskData[] = [];
  private completions: Array<{ playerId: string; displayName: string; score: number; completionTime: number }> = [];
  private activePlayerIds: Set<string> = new Set();

  getLobby(): LobbyPlayer[] {
    return [...this.lobby.values()];
  }

  getLobbyCount(): number {
    return this.lobby.size;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  getCurrentInstanceId(): string | null {
    return this.currentInstanceId;
  }

  joinLobby(player: LobbyPlayer): void {
    this.lobby.set(player.playerId, player);
    this.activePlayerIds.add(player.playerId);
  }

  removeFromLobby(playerId: string): LobbyPlayer | undefined {
    const player = this.lobby.get(playerId);
    this.lobby.delete(playerId);
    this.activePlayerIds.delete(playerId);
    return player;
  }

  isInLobby(playerId: string): boolean {
    return this.lobby.has(playerId);
  }

  startGame(mapId: string): { instanceId: string; tasks: GameTaskData[] } {
    this.status = 'IN_PLAY';
    this.currentInstanceId = randomUUID();
    this.completions = [];
    this.currentTasks = this.generateTasks(mapId);
    this.activePlayerIds = new Set(this.lobby.keys());
    return { instanceId: this.currentInstanceId, tasks: this.currentTasks };
  }

  playerComplete(playerId: string, score: number, completionTime: number): { rank: number; displayName: string } | null {
    if (this.status !== 'IN_PLAY') return null;

    const player = this.lobby.get(playerId);
    if (!player) return null;

    if (this.completions.some((c) => c.playerId === playerId)) return null;

    this.completions.push({
      playerId,
      displayName: player.displayName,
      score,
      completionTime,
    });

    this.completions.sort((a, b) => a.completionTime - b.completionTime || b.score - a.score);

    const rank = this.completions.findIndex((c) => c.playerId === playerId) + 1;
    return { rank, displayName: player.displayName };
  }

  endGame(): { leaderboard: LeaderboardEntry[] } {
    this.status = 'FINISHED';

    const leaderboard = this.completions.map((c, i) => ({
=======
// ── Simple task generation ──────────────────────────────────────
const CROP_TYPES = ['MAIZE', 'CASSAVA', 'COFFEE'];

function generateTasks(): GameTask[] {
  const templateIndex = Math.floor(Math.random() * 4);
  const crop = CROP_TYPES[Math.floor(Math.random() * CROP_TYPES.length)];

  switch (templateIndex) {
    case 0: {
      return [
        makeTask('collect', `Collect 1 ${crop.toLowerCase()} seed`, crop, 1, 100, 30),
        makeTask('plant', `Plant ${crop.toLowerCase()}`, crop, 1, 50, 20),
        makeTask('find_water', 'Find water', undefined, 1, 100, 25),
        makeTask('water', `Water ${crop.toLowerCase()}`, crop, 1, 50, 20),
        makeTask('harvest', `Harvest ${crop.toLowerCase()}`, crop, 1, 150, 30),
      ];
    }
    case 1: {
      return [
        makeTask('collect_multiple', 'Collect 3 maize seeds', 'MAIZE', 3, 150, 40),
        makeTask('collect_multiple', 'Collect 2 cassava seeds', 'CASSAVA', 2, 100, 30),
        makeTask('plant_multiple', 'Plant collected seeds', undefined, 5, 150, 30),
        makeTask('find_water', 'Find water', undefined, 1, 100, 25),
        makeTask('water_multiple', 'Water crops twice', undefined, 2, 100, 25),
        makeTask('harvest_multiple', 'Harvest crops', undefined, 5, 300, 40),
      ];
    }
    case 2: {
      return [
        makeTask('collect_multiple', 'Collect 2 coffee beans', 'COFFEE', 2, 150, 30),
        makeTask('collect_multiple', 'Collect 3 maize seeds', 'MAIZE', 3, 150, 40),
        makeTask('plant_multiple', 'Plant seeds', undefined, 5, 150, 30),
        makeTask('find_water', 'Find water', undefined, 1, 100, 25),
        makeTask('water_multiple', 'Water crops', undefined, 3, 150, 30),
        makeTask('harvest_multiple', 'Harvest', undefined, 5, 300, 40),
      ];
    }
    case 3: {
      return [
        makeTask('collect', 'Find cassava seed', 'CASSAVA', 1, 75, 25),
        makeTask('plant', 'Plant cassava', 'CASSAVA', 1, 50, 20),
        makeTask('find_water', 'Find water', undefined, 1, 100, 25),
        makeTask('water_multiple', 'Water cassava twice', 'CASSAVA', 2, 100, 30),
        makeTask('harvest', 'Harvest cassava', 'CASSAVA', 1, 150, 30),
      ];
    }
    default:
      return [
        makeTask('collect', 'Find a seed', 'MAIZE', 1, 100, 30),
        makeTask('plant', 'Plant the seed', 'MAIZE', 1, 50, 20),
        makeTask('find_water', 'Find water', undefined, 1, 100, 25),
        makeTask('water', 'Water crop', 'MAIZE', 1, 50, 20),
        makeTask('harvest', 'Harvest crop', 'MAIZE', 1, 150, 30),
      ];
  }
}

function makeTask(
  type: string,
  description: string,
  cropType: string | undefined,
  targetAmount: number,
  scoreReward: number,
  timeLimit: number,
): GameTask {
  return {
    id: randomUUID(),
    type,
    cropType,
    targetAmount,
    currentAmount: 0,
    timeLimit,
    scoreReward,
    description,
  };
}

// ═══════════════════════════════════════════════════════════════════
// GameCoordinator
// ═══════════════════════════════════════════════════════════════════

interface Completion {
  playerId: string;
  displayName: string;
  score: number;
  completionTime: number;
}

export class GameCoordinator {
  private currentInstance: EventInstanceRow | null = null;
  private lobby: Map<string, LobbyPlayer> = new Map();
  private completions: Completion[] = [];
  private tasks: GameTask[] = [];
  private maxCompletions = 10;
  private gameStartTime = 0;

  constructor(private socketManager: SocketManager) {}

  // ── Lobby ─────────────────────────────────────────────────────

  joinLobby(
    conn: PlayerConnection,
    playerId: string,
    displayName: string,
    characterType: string,
    mapId: string,
  ): void {
    this.lobby.set(playerId, {
      playerId,
      displayName,
      characterType,
      mapId,
      ready: false,
    });

    this.socketManager.setPlayerInfo(conn.id, playerId, displayName);

    this.broadcastLobby();
    this.socketManager.broadcastToAdmins({
      type: 'player_joined',
      displayName,
      characterType,
      mapId,
    });

    console.info(`[Lobby] ${displayName} joined (${this.lobby.size} players)`);
  }

  removeFromLobby(playerId: string): void {
    const player = this.lobby.get(playerId);
    if (!player) return;

    this.lobby.delete(playerId);

    if (!this.currentInstance || this.currentInstance.status === 'WAITING') {
      this.broadcastLobby();
      this.socketManager.broadcastToAdmins({
        type: 'player_left',
        displayName: player.displayName,
      });
    } else if (this.currentInstance.status === 'IN_PROGRESS') {
      updateInstancePlayerStatus(this.currentInstance.id, playerId, 'TIMEOUT');
    }

    console.info(`[Lobby] ${player.displayName} left (${this.lobby.size} players)`);
  }

  private broadcastLobby(): void {
    const players = Array.from(this.lobby.values());
    const msg = { type: 'lobby_update' as const, players, count: players.length };
    this.socketManager.broadcastToClients(msg);
    this.socketManager.broadcastToAdmins(msg);
  }

  // ── Game lifecycle ────────────────────────────────────────────

  startGame(mapId: string): { instanceId: string; tasks: GameTask[] } | null {
    const instance = createInstance(mapId);
    this.currentInstance = instance;
    this.completions = [];
    this.gameStartTime = Date.now();

    // Register all lobby players
    for (const [playerId, lobbyPlayer] of this.lobby) {
      const session = createSession(playerId);
      registerPlayerForInstance(
        instance.id,
        playerId,
        session.id,
        lobbyPlayer.characterType,
        lobbyPlayer.mapId,
      );
    }

    // Generate tasks once for all players
    this.tasks = generateTasks();

    updateInstanceStatus(instance.id, 'IN_PROGRESS');

    const gameStartMsg = {
      type: 'game_start' as const,
      instanceId: instance.id,
      tasks: this.tasks,
    };
    this.socketManager.broadcastToClients(gameStartMsg);
    this.socketManager.broadcastToAdmins({ type: 'game_started', instanceId: instance.id });

    console.info(`[Game] Started instance ${instance.id} with ${this.lobby.size} players, ${this.tasks.length} tasks`);

    return { instanceId: instance.id, tasks: this.tasks };
  }

  playerComplete(
    playerId: string,
    score: number,
    completionTime: number,
  ): void {
    if (!this.currentInstance) return;

    const lobbyPlayer = this.lobby.get(playerId);
    if (!lobbyPlayer) return;

    // Prevent duplicate completions
    if (this.completions.some((c) => c.playerId === playerId)) return;

    // Update DB
    updateInstancePlayerStatus(this.currentInstance.id, playerId, 'COMPLETED', score, completionTime);

    // Track in memory
    this.completions.push({ playerId, displayName: lobbyPlayer.displayName, score, completionTime });

    // Sort by completion time (faster = better), then score (higher = better)
    this.completions.sort((a, b) => a.completionTime - b.completionTime || b.score - a.score);

    const rank = this.completions.findIndex((c) => c.playerId === playerId) + 1;

    // Notify all
    this.socketManager.broadcastToAll({
      type: 'player_completed',
      displayName: lobbyPlayer.displayName,
      rank,
      score,
    });

    this.socketManager.broadcastToAdmins({
      type: 'leaderboard_update',
      entries: this.getLeaderboardEntries(),
    });

    console.info(`[Game] ${lobbyPlayer.displayName} completed (#${rank}, score=${score}, time=${completionTime}s)`);

    if (this.completions.length >= this.maxCompletions) {
      this.endGame();
    }
  }

  endGame(): void {
    if (!this.currentInstance) return;
    if (this.currentInstance.status === 'FINISHED') return;

    const leaderboard = this.buildLeaderboard();
    this.persistLeaderboard(leaderboard);

    updateInstanceStatus(this.currentInstance.id, 'FINISHED');

    // Notify all clients
    for (const conn of this.socketManager.getAllClientConnections()) {
      const entry = leaderboard.find((e) => e.playerId === conn.playerId);
      this.socketManager.sendTo(conn, {
        type: 'game_finished',
        leaderboard,
        yourRank: entry?.rank ?? null,
      });
    }

    this.socketManager.broadcastToAdmins({ type: 'game_finished', leaderboard });

    console.info(`[Game] Instance ${this.currentInstance.id} finished. ${leaderboard.length} players ranked.`);

    // Reset for next game
    this.currentInstance = null;
    this.lobby.clear();
    this.completions = [];
    this.tasks = [];
  }

  // ── Leaderboard ───────────────────────────────────────────────

  private getLeaderboardEntries(): LeaderboardEntry[] {
    return this.completions.map((c, i) => ({
      rank: i + 1,
      displayName: c.displayName,
      score: c.score,
      completionTime: c.completionTime,
      rewardType: REWARD_TYPES[i] ?? null,
    }));
  }

  private buildLeaderboard(): LeaderboardEntry[] {
    return this.completions.map((c, i) => ({
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
      rank: i + 1,
      playerId: c.playerId,
      displayName: c.displayName,
      score: c.score,
      completionTime: c.completionTime,
<<<<<<< HEAD
      rewardType: i < 10 ? REWARD_TYPES[i] : undefined,
    }));

    return { leaderboard };
  }

  getTopPlayers(): Array<{ playerId: string; score: number; completionTime: number; rank: number; rewardType?: string }> {
    return this.completions.slice(0, 10).map((c, i) => ({
      playerId: c.playerId,
      score: c.score,
      completionTime: c.completionTime,
      rank: i + 1,
      rewardType: REWARD_TYPES[i],
    }));
  }

  getActivePlayerIds(): Set<string> {
    return this.activePlayerIds;
  }

  reset(): void {
    this.lobby.clear();
    this.status = 'WAITING';
    this.currentInstanceId = null;
    this.currentTasks = [];
    this.completions = [];
    this.activePlayerIds.clear();
  }

  private generateTasks(_mapId: string): GameTaskData[] {
    const cropTypes: Array<'maize' | 'cassava' | 'coffee'> = ['maize', 'cassava', 'coffee'];
    const totalSeeds = randomInt(2, 5);
    const waterActions = randomInt(1, 2);

    const numCrops = randomInt(1, 3);
    const selectedCrops = this.shuffle(cropTypes).slice(0, numCrops);

    const cropAmounts: Array<{ cropType: 'maize' | 'cassava' | 'coffee'; amount: number }> = [];
    let remaining = totalSeeds;
    for (let i = 0; i < selectedCrops.length; i++) {
      const amount = i === selectedCrops.length - 1
        ? remaining
        : randomInt(1, Math.max(1, remaining - (selectedCrops.length - i - 1)));
      cropAmounts.push({ cropType: selectedCrops[i], amount });
      remaining -= amount;
    }

    const tasks: GameTaskData[] = [];

    for (const crop of cropAmounts) {
      const itemName = crop.cropType === 'coffee'
        ? (crop.amount === 1 ? 'bean' : 'beans')
        : (crop.amount === 1 ? 'seed' : 'seeds');
      tasks.push({
        id: `collect-${crop.cropType}-${randomInt(1000, 9999)}`,
        type: crop.amount === 1 ? 'collect_seed' : 'collect_multiple_seeds',
        cropType: crop.cropType,
        targetAmount: crop.amount,
        currentAmount: 0,
        timeLimit: 20 + crop.amount * 8,
        scoreReward: 80 + crop.amount * 40,
        description: `Find ${crop.amount} ${this.cropLabel(crop.cropType)} ${itemName}`,
      });
    }

    tasks.push({
      id: `plant-${randomInt(1000, 9999)}`,
      type: totalSeeds === 1 ? 'plant_seed' : 'plant_multiple_seeds',
      targetAmount: totalSeeds,
      currentAmount: 0,
      timeLimit: 25 + totalSeeds * 6,
      scoreReward: 100 + totalSeeds * 30,
      description: totalSeeds === 1 ? 'Plant your seed in a farm plot' : `Plant ${totalSeeds} collected seeds`,
    });

    tasks.push({
      id: `find-water-${randomInt(1000, 9999)}`,
      type: 'find_water',
      targetAmount: 1,
      currentAmount: 0,
      timeLimit: 25,
      scoreReward: 100,
      description: 'Find the active water source',
    });

    tasks.push({
      id: `water-${randomInt(1000, 9999)}`,
      type: waterActions === 1 ? 'water_crop' : 'water_crop_multiple',
      targetAmount: totalSeeds * waterActions,
      currentAmount: 0,
      timeLimit: 25 + totalSeeds * waterActions * 6,
      scoreReward: 100 + totalSeeds * waterActions * 35,
      description: waterActions === 1 ? 'Water every planted crop' : `Water crops ${waterActions} times each`,
    });

    tasks.push({
      id: `harvest-${randomInt(1000, 9999)}`,
      type: totalSeeds === 1 ? 'harvest_crop' : 'harvest_multiple',
      targetAmount: totalSeeds,
      currentAmount: 0,
      timeLimit: 25 + totalSeeds * 6,
      scoreReward: 150 + totalSeeds * 50,
      description: totalSeeds === 1 ? 'Harvest your crop' : `Harvest ${totalSeeds} ready crops`,
    });

    return tasks;
  }

  private cropLabel(cropType: string): string {
    switch (cropType) {
      case 'maize': return 'Maize';
      case 'cassava': return 'Cassava';
      case 'coffee': return 'Coffee';
      default: return cropType;
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
=======
      rewardType: REWARD_TYPES[i] ?? null,
    }));
  }

  private persistLeaderboard(entries: LeaderboardEntry[]): void {
    if (!this.currentInstance) return;

    for (const entry of entries) {
      // Find the playerId from completions
      const completion = this.completions.find(
        (c) => c.displayName === entry.displayName,
      );
      const playerId = completion?.playerId ?? entry.playerId ?? '';

      insertLeaderboardEntry(
        this.currentInstance.id,
        playerId,
        entry.rank,
        entry.score,
        entry.completionTime,
        entry.rewardType,
        null,
      );
    }
  }

  // ── Getters ───────────────────────────────────────────────────

  getCurrentInstance(): EventInstanceRow | null {
    return this.currentInstance;
  }

  getLobbySize(): number {
    return this.lobby.size;
  }

  getCompletionCount(): number {
    return this.completions.length;
  }

  isGameActive(): boolean {
    return this.currentInstance !== null && this.currentInstance.status === 'IN_PROGRESS';
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  }
}
