import { getCharacterOption } from '../../data/CharacterOptions';
import { LeaderboardEntry } from '../../api/GameSocket';
import { buttonStyle } from '../components/Button';
import { darkCardStyle } from '../theme';
import { Screen } from './Screen';

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

const medal = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
};

export class LeaderboardScreen extends Screen {
  show(
    data: {
      entries: LeaderboardEntry[];
      playerId?: string;
      yourRank?: number;
      yourScore?: number;
      isTop10?: boolean;
    },
    callbacks: { onPlayAgain: () => void },
  ): void {
    const yourRank = data.yourRank ?? data.entries.find((entry) => entry.playerId === data.playerId)?.rank;
    const yourScore = data.yourScore ?? data.entries.find((entry) => entry.playerId === data.playerId)?.score ?? 0;
    const isTop10 = data.isTop10 ?? (yourRank != null && yourRank <= 10);

    this.container.innerHTML = `
      <div style="${darkCardStyle};max-height:min(92vh,820px);overflow:auto;">
        ${isTop10 && yourRank ? `
          <div style="background:rgba(255,227,109,0.12);border:2px solid #ffe36d;border-radius:18px;padding:18px;margin-bottom:18px;">
            <h2 style="font-size:clamp(24px,5vw,32px);margin:0 0 8px;color:#ffe36d;">🎉 Congratulations!</h2>
            <p style="margin:0 0 8px;font-weight:900;font-size:18px;">You finished in the TOP 10!</p>
            <p style="margin:0 0 8px;font-weight:800;">Your Rank: #${yourRank}</p>
            <p style="margin:0 0 8px;font-weight:800;">Your Reward: Coffee Shop Gift Card</p>
            <p style="margin:0;color:#d8f5c6;font-weight:800;">A QR code coupon has been sent to your email. Present it at any participating location to claim your reward!</p>
          </div>
        ` : ''}
        <h1 style="font-size:clamp(32px,7vw,48px);margin:0 0 16px;color:#ffe36d;">🏆 Leaderboard</h1>
        <div style="text-align:left;margin-bottom:18px;">
          ${data.entries.length === 0 ? `<p style="color:#d8f5c6;font-weight:800;">Waiting for results...</p>` : data.entries.map((entry) => {
            const character = getCharacterOption(entry.characterType);
            const mine = entry.playerId === data.playerId;
            return `
              <div style="
                display:flex;justify-content:space-between;gap:12px;align-items:center;
                padding:10px 12px;border-radius:12px;margin-bottom:8px;font-weight:900;
                background:${mine ? 'rgba(255,227,109,0.18)' : 'rgba(255,255,255,0.06)'};
                font-size:clamp(16px,3vw,20px);
              ">
                <span>${medal(entry.rank)} ${entry.rank}. ${character.icon} ${entry.displayName}</span>
                <span style="color:#ffe36d;">${entry.score} pts &nbsp;(${formatTime(entry.completionTime)})</span>
              </div>
            `;
          }).join('')}
        </div>
        <p style="font-size:clamp(18px,3.4vw,22px);margin:0 0 6px;font-weight:1000;">YOUR RANK: ${yourRank ? `#${yourRank}` : '—'}</p>
        <p style="font-size:clamp(18px,3.4vw,22px);margin:0 0 16px;color:#ffe36d;font-weight:1000;">YOUR SCORE: ${yourScore} pts</p>
        <p style="margin:0 0 22px;color:#d8f5c6;font-weight:800;">🎉 Top 10 players receive rewards! Check your email for your QR code.</p>
        <button id="play-again-btn" type="button" style="${buttonStyle('#52a447')}">Play Again</button>
      </div>
    `;

    document.getElementById('play-again-btn')!.addEventListener('click', callbacks.onPlayAgain);
    this.reveal();
  }
}
