import { randomUUID } from 'node:crypto';
import { GameTaskData, LeaderboardEntry, LobbyPlayer } from './types.js';

type GameStatus = 'WAITING' | 'IN_PLAY' | 'FINISHED';

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

const randomInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

export class GameCoordinator {
  private lobby: Map<string, LobbyPlayer> = new Map();
  private status: GameStatus = 'WAITING';
  private currentInstanceId: string | null = null;
  private currentTasks: GameTaskData[] = [];
  private completions: Array<{ playerId: string; displayName: string; score: number; completionTime: number }> = [];
  private activePlayerIds: Set<string> = new Set();

  getLobby(): LobbyPlayer[] { return [...this.lobby.values()]; }
  getLobbyCount(): number { return this.lobby.size; }
  getStatus(): GameStatus { return this.status; }
  getCurrentInstanceId(): string | null { return this.currentInstanceId; }

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

    this.completions.push({ playerId, displayName: player.displayName, score, completionTime });
    this.completions.sort((a, b) => a.completionTime - b.completionTime || b.score - a.score);
    const rank = this.completions.findIndex((c) => c.playerId === playerId) + 1;
    return { rank, displayName: player.displayName };
  }

  endGame(): { leaderboard: LeaderboardEntry[] } {
    this.status = 'FINISHED';
    const leaderboard = this.completions.map((c, i) => ({
      rank: i + 1, playerId: c.playerId, displayName: c.displayName,
      score: c.score, completionTime: c.completionTime,
      rewardType: i < 10 ? REWARD_TYPES[i] : undefined,
    }));
    return { leaderboard };
  }

  getTopPlayers(): Array<{ playerId: string; score: number; completionTime: number; rank: number; rewardType?: string }> {
    return this.completions.slice(0, 10).map((c, i) => ({
      playerId: c.playerId, score: c.score, completionTime: c.completionTime,
      rank: i + 1, rewardType: REWARD_TYPES[i],
    }));
  }

  getActivePlayerIds(): Set<string> { return this.activePlayerIds; }

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
      const itemName = crop.cropType === 'coffee' ? (crop.amount === 1 ? 'bean' : 'beans') : (crop.amount === 1 ? 'seed' : 'seeds');
      tasks.push({
        id: `collect-${crop.cropType}-${randomInt(1000, 9999)}`,
        type: crop.amount === 1 ? 'collect_seed' : 'collect_multiple_seeds',
        cropType: crop.cropType, targetAmount: crop.amount, currentAmount: 0,
        timeLimit: 20 + crop.amount * 8, scoreReward: 80 + crop.amount * 40,
        description: `Find ${crop.amount} ${this.cropLabel(crop.cropType)} ${itemName}`,
      });
    }
    tasks.push({ id: `plant-${randomInt(1000, 9999)}`, type: totalSeeds === 1 ? 'plant_seed' : 'plant_multiple_seeds', targetAmount: totalSeeds, currentAmount: 0, timeLimit: 25 + totalSeeds * 6, scoreReward: 100 + totalSeeds * 30, description: totalSeeds === 1 ? 'Plant your seed in a farm plot' : `Plant ${totalSeeds} collected seeds` });
    tasks.push({ id: `find-water-${randomInt(1000, 9999)}`, type: 'find_water', targetAmount: 1, currentAmount: 0, timeLimit: 25, scoreReward: 100, description: 'Find the active water source' });
    tasks.push({ id: `water-${randomInt(1000, 9999)}`, type: waterActions === 1 ? 'water_crop' : 'water_crop_multiple', targetAmount: totalSeeds * waterActions, currentAmount: 0, timeLimit: 25 + totalSeeds * waterActions * 6, scoreReward: 100 + totalSeeds * waterActions * 35, description: waterActions === 1 ? 'Water every planted crop' : `Water crops ${waterActions} times each` });
    tasks.push({ id: `harvest-${randomInt(1000, 9999)}`, type: totalSeeds === 1 ? 'harvest_crop' : 'harvest_multiple', targetAmount: totalSeeds, currentAmount: 0, timeLimit: 25 + totalSeeds * 6, scoreReward: 150 + totalSeeds * 50, description: totalSeeds === 1 ? 'Harvest your crop' : `Harvest ${totalSeeds} ready crops` });
    return tasks;
  }

  private cropLabel(cropType: string): string {
    switch (cropType) { case 'maize': return 'Maize'; case 'cassava': return 'Cassava'; case 'coffee': return 'Coffee'; default: return cropType; }
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
