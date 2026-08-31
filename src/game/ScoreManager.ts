export class ScoreManager {
  private score = 0;

  add(points: number): void {
    this.score += points;
  }

  getScore(): number {
    return this.score;
  }

  reset(): void {
    this.score = 0;
  }
}
