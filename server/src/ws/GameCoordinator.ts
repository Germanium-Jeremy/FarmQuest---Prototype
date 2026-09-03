import { randomUUID } from 'node:crypto';
import { GameTaskData, LeaderboardEntry, LobbyPlayer } from './types.js';

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

const randomInt = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

interface PlayerInstance {
  instanceId: string;
  tasks: GameTaskData[];
}

export class GameCoordinator {
  private lobby: Map<string, LobbyPlayer> = new Map();
  /** Per-player instance: keyed by connId (sessionId) */
  private playerInstances: Map<string, PlayerInstance> = new Map();
  private completions: Array<{
    playerId: string;
    displayName: string;
    score: number;
    completionTime: number;
  }> = [];
  /** Players who have completed or timed out (by databaseId) */
  private finishedPlayerIds: Set<string> = new Set();

  getLobby(): LobbyPlayer[] {
    return [...this.lobby.values()];
  }
  getLobbyCount(): number {
    return this.lobby.size;
  }

  /** Returns 'IN_PLAY' while any player is still active, 'FINISHED' once all done */
  getStatus(): 'IN_PLAY' | 'FINISHED' {
    if (this.lobby.size === 0 && this.completions.length === 0) return 'FINISHED';
    if (this.allPlayersFinished()) return 'FINISHED';
    return 'IN_PLAY';
  }

  getCurrentInstanceId(): string | null {
    // Return any active instance id (for backwards compat with DB calls)
    for (const inst of this.playerInstances.values()) {
      return inst.instanceId;
    }
    if (this.completions.length > 0) return null;
    return null;
  }

  joinLobby(player: LobbyPlayer): void {
    this.lobby.set(player.playerId, player);
  }

  removeFromLobby(playerId: string): LobbyPlayer | undefined {
    const player = this.lobby.get(playerId);
    if (player) {
      // Mark as timed out if they were still playing
      if (!this.finishedPlayerIds.has(player.databaseId)) {
        this.finishedPlayerIds.add(player.databaseId);
      }
      this.lobby.delete(playerId);
      this.playerInstances.delete(playerId);
    }
    return player;
  }

  /**
   * Create a new independent game instance for a single player.
   * Each player gets their own instance with their own tasks.
   */
  createPlayerInstance(
    connId: string,
    mapId: string,
  ): { instanceId: string; tasks: GameTaskData[] } {
    const instanceId = randomUUID();
    const tasks = this.generateTasks(mapId);
    this.playerInstances.set(connId, { instanceId, tasks });
    return { instanceId, tasks };
  }

  getPlayerInstance(connId: string): PlayerInstance | undefined {
    return this.playerInstances.get(connId);
  }

  playerComplete(
    playerId: string,
    score: number,
    completionTime: number,
  ): { rank: number; displayName: string } | null {
    const player = this.lobby.get(playerId);
    if (!player) return null;
    // Idempotent: don't add duplicate completions
    if (this.completions.some((c) => c.playerId === player.databaseId))
      return null;

    this.finishedPlayerIds.add(player.databaseId);
    this.completions.push({
      playerId: player.databaseId,
      displayName: player.displayName,
      score,
      completionTime,
    });
    this.completions.sort(
      (a, b) => a.completionTime - b.completionTime || b.score - a.score,
    );
    const rank =
      this.completions.findIndex((c) => c.playerId === player.databaseId) + 1;
    return { rank, displayName: player.displayName };
  }

  markPlayerTimedOut(databaseId: string): void {
    this.finishedPlayerIds.add(databaseId);
  }

  /** Check if a player has already completed or timed out */
  hasPlayerFinished(databaseId: string): boolean {
    return this.finishedPlayerIds.has(databaseId);
  }

  endGame(): { leaderboard: LeaderboardEntry[] } {
    const leaderboard = this.completions.map((c, i) => ({
      rank: i + 1,
      playerId: c.playerId,
      displayName: c.displayName,
      score: c.score,
      completionTime: c.completionTime,
      rewardType: i < 10 ? REWARD_TYPES[i] : undefined,
    }));
    return { leaderboard };
  }

  getTopPlayers(): Array<{
    playerId: string;
    score: number;
    completionTime: number;
    rank: number;
    rewardType?: string;
  }> {
    const maxRewards = Math.min(this.completions.length, 10);
    return this.completions.slice(0, maxRewards).map((c, i) => ({
      playerId: c.playerId,
      score: c.score,
      completionTime: c.completionTime,
      rank: i + 1,
      rewardType: REWARD_TYPES[i],
    }));
  }

  /** True when every player in the lobby has completed or timed out */
  allPlayersFinished(): boolean {
    if (this.lobby.size === 0) return this.completions.length > 0;
    for (const player of this.lobby.values()) {
      if (!this.finishedPlayerIds.has(player.databaseId)) return false;
    }
    return true;
  }

  reset(): void {
    this.lobby.clear();
    this.playerInstances.clear();
    this.completions = [];
    this.finishedPlayerIds.clear();
  }

  private generateTasks(_mapId: string): GameTaskData[] {
    const cropTypes: Array<'maize' | 'cassava' | 'coffee'> = [
      'maize',
      'cassava',
      'coffee',
    ];
    const totalSeeds = randomInt(2, 5);
    const waterActions = randomInt(1, 2);
    const numCrops = randomInt(1, 3);
    const selectedCrops = this.shuffle(cropTypes).slice(0, numCrops);

    const cropAmounts: Array<{
      cropType: 'maize' | 'cassava' | 'coffee';
      amount: number;
    }> = [];
    let remaining = totalSeeds;
    for (let i = 0; i < selectedCrops.length; i++) {
      const amount =
        i === selectedCrops.length - 1
          ? remaining
          : randomInt(
              1,
              Math.max(1, remaining - (selectedCrops.length - i - 1)),
            );
      cropAmounts.push({ cropType: selectedCrops[i], amount });
      remaining -= amount;
    }

    const tasks: GameTaskData[] = [];
    for (const crop of cropAmounts) {
      const itemName =
        crop.cropType === 'coffee'
          ? crop.amount === 1
            ? 'bean'
            : 'beans'
          : crop.amount === 1
            ? 'seed'
            : 'seeds';
      tasks.push({
        id: `collect-${crop.cropType}-${randomInt(1000, 9999)}`,
        type:
          crop.amount === 1
            ? 'collect_seed'
            : 'collect_multiple_seeds',
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
      type:
        totalSeeds === 1 ? 'plant_seed' : 'plant_multiple_seeds',
      targetAmount: totalSeeds,
      currentAmount: 0,
      timeLimit: 25 + totalSeeds * 6,
      scoreReward: 100 + totalSeeds * 30,
      description:
        totalSeeds === 1
          ? 'Plant your seed in a farm plot'
          : `Plant ${totalSeeds} collected seeds`,
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
      type:
        waterActions === 1
          ? 'water_crop'
          : 'water_crop_multiple',
      targetAmount: totalSeeds * waterActions,
      currentAmount: 0,
      timeLimit: 25 + totalSeeds * waterActions * 6,
      scoreReward: 100 + totalSeeds * waterActions * 35,
      description:
        waterActions === 1
          ? 'Water every planted crop'
          : `Water crops ${waterActions} times each`,
    });
    tasks.push({
      id: `harvest-${randomInt(1000, 9999)}`,
      type:
        totalSeeds === 1 ? 'harvest_crop' : 'harvest_multiple',
      targetAmount: totalSeeds,
      currentAmount: 0,
      timeLimit: 25 + totalSeeds * 6,
      scoreReward: 150 + totalSeeds * 50,
      description:
        totalSeeds === 1
          ? 'Harvest your crop'
          : `Harvest ${totalSeeds} ready crops`,
    });
    return tasks;
  }

  private cropLabel(cropType: string): string {
    switch (cropType) {
      case 'maize':
        return 'Maize';
      case 'cassava':
        return 'Cassava';
      case 'coffee':
        return 'Coffee';
      default:
        return cropType;
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
