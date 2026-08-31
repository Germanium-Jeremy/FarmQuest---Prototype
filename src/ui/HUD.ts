import { Challenge, GameState } from '../game/GameState';
import { ChallengeManager } from '../game/ChallengeManager';
import { ScoreManager } from '../game/ScoreManager';

export class HUD {
  private overlay: HTMLElement;
  private hudEl: HTMLElement;
  private promptEl: HTMLElement;
  private screenEl: HTMLElement;
  private scoreManager: ScoreManager;
  private challengeManager: ChallengeManager;

  constructor(
    overlay: HTMLElement,
    scoreManager: ScoreManager,
    challengeManager: ChallengeManager
  ) {
    this.overlay = overlay;
    this.scoreManager = scoreManager;
    this.challengeManager = challengeManager;
    this.overlay.innerHTML = '';
    this.overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';

    // HUD bar
    this.hudEl = document.createElement('div');
    this.hudEl.style.cssText = `
      position:absolute;top:0;left:0;right:0;padding:16px 24px;
      background:linear-gradient(180deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0) 100%);
      color:white;font-size:18px;font-weight:bold;display:flex;
      justify-content:space-between;align-items:center;
      pointer-events:none;font-family:'Segoe UI',sans-serif;
    `;
    this.overlay.appendChild(this.hudEl);

    // Interaction prompt
    this.promptEl = document.createElement('div');
    this.promptEl.style.cssText = `
      position:absolute;bottom:80px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.7);color:#FFD700;padding:12px 24px;
      border-radius:12px;font-size:18px;font-weight:bold;
      display:none;text-align:center;
      border:2px solid #FFD700;pointer-events:none;
      font-family:'Segoe UI',sans-serif;
    `;
    this.overlay.appendChild(this.promptEl);

    // Full-screen overlays (menu, game over, complete)
    this.screenEl = document.createElement('div');
    this.screenEl.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      display:none;justify-content:center;align-items:center;
      background:rgba(0,0,0,0.85);pointer-events:all;
      font-family:'Segoe UI',sans-serif;
    `;
    this.overlay.appendChild(this.screenEl);
  }

  updateHUD(taskText: string, timeRemaining: number): void {
    const timeStr = String(Math.floor(timeRemaining / 60)).padStart(2, '0') + ':' +
      String(Math.floor(timeRemaining) % 60).padStart(2, '0');

    const isLowTime = timeRemaining <= 5;

    this.hudEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:22px;">🌱</span>
        <span style="color:${isLowTime ? '#ff4444' : '#ffffff'};">TASK: ${taskText}</span>
      </div>
      <div style="display:flex;gap:30px;align-items:center;">
        <span style="color:${isLowTime ? '#ff4444' : '#4CAF50'};font-size:22px;">⏱ TIME: ${timeStr}</span>
        <span style="color:#FFD700;font-size:22px;">⭐ SCORE: ${this.scoreManager.getScore()}</span>
      </div>
    `;
  }

  showPrompt(text: string): void {
    this.promptEl.style.display = 'block';
    this.promptEl.textContent = `Press [E] to ${text}`;
  }

  hidePrompt(): void {
    this.promptEl.style.display = 'none';
  }

  showMenu(): void {
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="text-align:center;color:white;">
        <h1 style="font-size:48px;margin-bottom:10px;">🌾 FARMQUEST 🌾</h1>
        <p style="font-size:20px;color:#ccc;margin-bottom:40px;">Find seeds, water your crops, and harvest for points!</p>
        <button id="start-btn" style="
          padding:16px 48px;font-size:22px;font-weight:bold;
          background:#4CAF50;color:white;border:none;border-radius:12px;
          cursor:pointer;pointer-events:all;
          box-shadow:0 4px 15px rgba(76,175,80,0.4);
          transition:transform 0.2s;
        ">🌱 START GAME</button>
        <div style="margin-top:30px;color:#888;font-size:14px;">
          WASD/Arrow Keys to move · E or Space to interact
        </div>
      </div>
    `;

    const btn = document.getElementById('start-btn')!;
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
  }

  showGameOver(onRetry: () => void): void {
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="text-align:center;color:white;">
        <h1 style="font-size:48px;margin-bottom:10px;color:#ff4444;">⏰ TIME'S UP!</h1>
        <p style="font-size:22px;color:#ccc;margin-bottom:10px;">Game Over</p>
        <p style="font-size:28px;color:#FFD700;margin-bottom:30px;">Final Score: ${this.scoreManager.getScore()}</p>
        <button id="retry-btn" style="
          padding:16px 48px;font-size:22px;font-weight:bold;
          background:#ff4444;color:white;border:none;border-radius:12px;
          cursor:pointer;pointer-events:all;
          box-shadow:0 4px 15px rgba(255,68,68,0.4);
        ">🔄 RETRY</button>
      </div>
    `;
    document.getElementById('retry-btn')!.addEventListener('click', onRetry);
  }

  showComplete(onRetry: () => void): void {
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="text-align:center;color:white;">
        <h1 style="font-size:48px;margin-bottom:10px;color:#4CAF50;">🎉 CHALLENGE COMPLETE!</h1>
        <p style="font-size:28px;color:#FFD700;margin-bottom:30px;">SCORE: ${this.scoreManager.getScore()}</p>
        <div style="
          background:rgba(255,215,0,0.1);border:2px solid #FFD700;
          border-radius:16px;padding:30px 40px;margin-bottom:30px;
          display:inline-block;
        ">
          <h2 style="font-size:24px;color:#FFD700;margin-bottom:10px;">🎁 REWARD</h2>
          <p style="font-size:20px;">FREE COFFEE ☕</p>
          <div style="
            margin-top:15px;width:100px;height:100px;
            background:white;border-radius:8px;margin:15px auto 0;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;color:#333;
          ">[QR CODE]</div>
        </div>
        <br>
        <button id="retry-btn" style="
          padding:16px 48px;font-size:22px;font-weight:bold;
          background:#4CAF50;color:white;border:none;border-radius:12px;
          cursor:pointer;pointer-events:all;
          box-shadow:0 4px 15px rgba(76,175,80,0.4);
        ">🔄 PLAY AGAIN</button>
      </div>
    `;
    document.getElementById('retry-btn')!.addEventListener('click', onRetry);
  }

  hideScreen(): void {
    this.screenEl.style.display = 'none';
  }

  hideHUD(): void {
    this.hudEl.innerHTML = '';
  }
}
