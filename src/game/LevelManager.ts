import { LEVEL_CONFIG, LevelConfig, TOTAL_LEVELS } from '../data/LevelConfig';

export class LevelManager {
  private currentLevelIndex = 0;
  private completedLevels = new Set<number>();
  private levelStartScore = 0;

  getCurrentLevel(): LevelConfig {
    return LEVEL_CONFIG[this.currentLevelIndex];
  }

  getAllLevels(): LevelConfig[] {
    return LEVEL_CONFIG;
  }

  getCompletedLevels(): number[] {
    return [...this.completedLevels].sort((a, b) => a - b);
  }

  beginCurrentLevel(totalScore: number): void {
    this.levelStartScore = totalScore;
  }

  getLevelScore(totalScore: number): number {
    return Math.max(0, totalScore - this.levelStartScore);
  }

  completeCurrentLevel(): void {
    this.completedLevels.add(this.getCurrentLevel().id);
  }

  hasNextLevel(): boolean {
    return this.currentLevelIndex < TOTAL_LEVELS - 1;
  }

  advanceToNextLevel(): boolean {
    if (!this.hasNextLevel()) return false;
    this.currentLevelIndex += 1;
    return true;
  }

  resetToFirstLevel(): void {
    this.currentLevelIndex = 0;
    this.completedLevels.clear();
    this.levelStartScore = 0;
  }
}
