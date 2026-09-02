import { buttonStyle } from '../components/Button';
import { darkCardStyle } from '../theme';
import { Screen } from './Screen';

export class CompleteScreen extends Screen {
  show(
    data: { score: number; rank?: number; isTop10?: boolean },
    callbacks: { onLeaderboard: () => void; onPlayAgain: () => void },
  ): void {
    const isTop10 = data.isTop10 ?? (data.rank != null && data.rank <= 10);

    this.container.innerHTML = `
      <div style="${darkCardStyle}">
        <h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 10px;color:#bff28a;">🎉 Congratulations!</h1>
        <p style="font-size:clamp(18px,3.6vw,24px);color:#e9f6e4;margin:0 0 8px;font-weight:900;">
          You completed all FarmQuest tasks!
        </p>
        <p style="font-size:clamp(24px,5vw,28px);color:#ffe36d;margin:0 0 18px;font-weight:1000;">⭐ Final Score: ${data.score}</p>
        ${isTop10 ? `
          <div style="display:inline-block;background:rgba(255,227,109,0.12);border:2px solid #ffe36d;border-radius:18px;padding:22px 28px;margin-bottom:22px;">
            <h2 style="font-size:clamp(22px,4vw,28px);margin:0 0 8px;color:#ffe36d;">🎁 You finished in the TOP 10!</h2>
            ${data.rank ? `<p style="font-size:20px;margin:0 0 8px;font-weight:900;">Your Rank: #${data.rank}</p>` : ''}
            <p style="font-size:18px;margin:0;font-weight:800;color:#d8f5c6;">A QR code coupon has been sent to your email. You can now claim your reward.</p>
          </div>
        ` : `
          <p style="font-size:18px;margin:0 0 22px;font-weight:800;color:#d8f5c6;">
            Top 10 players receive rewards. Check the leaderboard for your rank.
          </p>
        `}
        <div>
          <button id="leaderboard-btn" type="button" style="${buttonStyle('#52a447')}">View Leaderboard</button>
          <button id="play-again-btn" type="button" style="${buttonStyle('#e7a53b')};margin-left:10px;">Play Again</button>
        </div>
      </div>
    `;

    document.getElementById('leaderboard-btn')!.addEventListener('click', callbacks.onLeaderboard);
    document.getElementById('play-again-btn')!.addEventListener('click', callbacks.onPlayAgain);
    this.reveal();
  }
}
