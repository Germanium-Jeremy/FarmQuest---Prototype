export class ScoreManager {
  private score = 0;

  add(points: number): void {
    this.score += points;
  }

  getScore(): number {
    return this.score;
  }

  setScore(score: number): void {
    this.score = Math.max(0, Math.round(score));
  }

  reset(): void {
    this.score = 0;
  }
}
