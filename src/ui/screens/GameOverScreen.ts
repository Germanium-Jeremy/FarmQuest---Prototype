import { GameTask } from '../../game/GameTask';
import { buttonStyle } from '../components/Button';
import { darkCardStyle } from '../theme';
import { Screen } from './Screen';

export class GameOverScreen extends Screen {
  show(
    data: { score: number; currentTask?: GameTask | null },
    callbacks: { onPlayAgain: () => void; onLeaderboard?: () => void },
  ): void {
    const task = data.currentTask;

    this.container.innerHTML = `
      <div style="${darkCardStyle}">
        <h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 10px;color:#ff766e;">⏱ Time's Up!</h1>
        <p style="font-size:20px;color:#e9f6e4;margin:0 0 18px;font-weight:800;">You did not complete the current task.</p>
        ${task ? `
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:16px;margin-bottom:22px;">
            <div style="font-size:12px;font-weight:1000;color:#bff28a;margin-bottom:5px;">CURRENT TASK</div>
            <div style="font-size:clamp(22px,4vw,28px);font-weight:1000;">${task.description}</div>
            <div style="font-size:20px;color:#ffe36d;margin-top:8px;">Progress: ${task.currentAmount} / ${task.targetAmount}</div>
          </div>
        ` : ''}
        <p style="font-size:clamp(24px,5vw,28px);color:#ffe36d;margin:0 0 28px;font-weight:1000;">⭐ Final Score: ${data.score}</p>
        <button id="retry-btn" type="button" style="${buttonStyle('#e5534b')}">Play Again</button>
        ${callbacks.onLeaderboard ? `<button id="leaderboard-btn" type="button" style="${buttonStyle('#52a447')};margin-left:10px;">View Leaderboard</button>` : ''}
      </div>
    `;

    document.getElementById('retry-btn')!.addEventListener('click', callbacks.onPlayAgain);
    document.getElementById('leaderboard-btn')?.addEventListener('click', () => callbacks.onLeaderboard?.());
    this.reveal();
  }
}
