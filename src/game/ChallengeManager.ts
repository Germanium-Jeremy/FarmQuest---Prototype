import { Challenge } from './GameState';
import { ScoreManager } from './ScoreManager';

export interface ChallengeConfig {
  challenge: Challenge;
  taskText: string;
  timeLimit: number;
  reward: number;
}

const CHALLENGES: ChallengeConfig[] = [
  { challenge: Challenge.FIND_SEED, taskText: 'FIND SEEDS', timeLimit: 30, reward: 100 },
  { challenge: Challenge.FIND_WATER, taskText: 'FIND WATER', timeLimit: 20, reward: 100 },
  { challenge: Challenge.HARVEST, taskText: 'HARVEST YOUR CROP', timeLimit: 30, reward: 150 },
];

export class ChallengeManager {
  private currentIndex = 0;
  private timeRemaining = 0;
  private active = false;
  private onTimeout: (() => void) | null = null;
  private onUpdate: (() => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor(private scoreManager: ScoreManager) {}

  start(onTimeout: () => void, onUpdate: () => void, onComplete: () => void): void {
    this.currentIndex = 0;
    this.onTimeout = onTimeout;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.startChallenge();
  }

  private startChallenge(): void {
    const config = this.currentConfig();
    if (!config) {
      this.active = false;
      this.onComplete?.();
      return;
    }
    this.timeRemaining = config.timeLimit;
    this.active = true;
    this.onUpdate?.();
  }

  currentConfig(): ChallengeConfig | null {
    if (this.currentIndex >= CHALLENGES.length) return null;
    return CHALLENGES[this.currentIndex];
  }

  currentChallenge(): Challenge | null {
    return this.currentConfig()?.challenge ?? null;
  }

  getTimeRemaining(): number {
    return Math.max(0, Math.ceil(this.timeRemaining));
  }

  isActive(): boolean {
    return this.active;
  }

  completeChallenge(): void {
    const config = this.currentConfig();
    if (config) {
      this.scoreManager.add(config.reward);
    }
    this.currentIndex++;
    if (this.currentIndex >= CHALLENGES.length) {
      this.active = false;
      this.onComplete?.();
    } else {
      this.startChallenge();
    }
  }

  update(delta: number): void {
    if (!this.active) return;
    this.timeRemaining -= delta;
    this.onUpdate?.();
    if (this.timeRemaining <= 0) {
      this.active = false;
      this.onTimeout?.();
    }
  }

  reset(): void {
    this.currentIndex = 0;
    this.timeRemaining = 0;
    this.active = false;
  }
}
