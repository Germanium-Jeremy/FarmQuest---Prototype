import { GameSocket, LeaderboardEntry, LobbyPlayer } from '../api/GameSocket';
import { getCharacterOption } from '../data/CharacterOptions';
import { getMapOption, MapId } from '../data/MapOptions';

const EXPECTED_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'farmquest';
const socket = new GameSocket();

const authGate = document.getElementById('auth-gate')!;
const dashboard = document.getElementById('dashboard')!;
const authForm = document.getElementById('auth-form') as HTMLFormElement;
const tokenInput = document.getElementById('admin-token') as HTMLInputElement;
const authError = document.getElementById('auth-error')!;
const playerList = document.getElementById('player-list')!;
const playerTotal = document.getElementById('player-total')!;
const leaderboardList = document.getElementById('leaderboard-list')!;
const elapsedTime = document.getElementById('elapsed-time')!;
const statusPill = document.getElementById('status-pill')!;
const statusLabel = document.getElementById('status-label')!;
const mapLabel = document.getElementById('map-label')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const endBtn = document.getElementById('end-btn') as HTMLButtonElement;

let players: LobbyPlayer[] = [];
let entries: LeaderboardEntry[] = [];
let status: 'waiting' | 'playing' | 'ended' = 'waiting';
let elapsedSeconds = 0;
let tick: number | null = null;

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};

const medal = (rank: number): string => {
  if (rank === 1) return '🥇 ';
  if (rank === 2) return '🥈 ';
  if (rank === 3) return '🥉 ';
  return '';
};

const mapSummary = (): string => {
  if (players.length === 0) return '—';
  const counts = new Map<MapId, number>();
  for (const player of players) {
    counts.set(player.mapId, (counts.get(player.mapId) ?? 0) + 1);
  }
  const [id] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const map = getMapOption(id);
  return `${map.name} (${map.description})`;
};

const renderPlayers = (): void => {
  playerList.innerHTML = players.map((player) => {
    const character = getCharacterOption(player.characterType);
    const map = getMapOption(player.mapId);
    return `<div class="row">${character.icon} ${player.displayName} - ${map.name}</div>`;
  }).join('') || '<div class="row">Waiting for players...</div>';
  playerTotal.textContent = `Total: ${players.length} players`;
  playerList.scrollTop = playerList.scrollHeight;
  mapLabel.textContent = `Map: ${mapSummary()}`;
};

const renderLeaderboard = (): void => {
  leaderboardList.innerHTML = entries.map((entry) => {
    const character = getCharacterOption(entry.characterType);
    return `<div class="row">${medal(entry.rank)}${entry.rank}. ${character.icon} ${entry.displayName} - ${entry.score}</div>`;
  }).join('') || '<div class="row">No results yet</div>';
};

const renderStatus = (): void => {
  const label = status.toUpperCase();
  statusPill.textContent = label;
  statusLabel.textContent = `Status: ${label}`;
  elapsedTime.textContent = `Time: ${formatTime(elapsedSeconds)}`;
};

const setStatus = (next: 'waiting' | 'playing' | 'ended'): void => {
  status = next;
  renderStatus();
  if (tick) window.clearInterval(tick);
  tick = null;
  if (status === 'playing') {
    tick = window.setInterval(() => {
      elapsedSeconds += 1;
      elapsedTime.textContent = `Time: ${formatTime(elapsedSeconds)}`;
    }, 1000);
  }
};

authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (!token || token !== EXPECTED_TOKEN) {
    authError.textContent = 'Invalid admin token.';
    return;
  }

  authGate.classList.add('hidden');
  dashboard.classList.remove('hidden');
  socket.connectAdmin(token);
});

socket.on('lobby_update', (message) => {
  players = (message.players as LobbyPlayer[] | undefined) ?? [];
  if (message.status === 'waiting' || message.status === 'playing' || message.status === 'ended') {
    if (status !== message.status) {
      if (message.status === 'playing') elapsedSeconds = Number(message.elapsedSeconds ?? elapsedSeconds);
      setStatus(message.status);
    } else if (message.status === 'playing') {
      elapsedSeconds = Number(message.elapsedSeconds ?? elapsedSeconds);
      renderStatus();
    }
  }
  renderPlayers();
});

socket.on('leaderboard', (message) => {
  entries = (message.entries as LeaderboardEntry[] | undefined) ?? [];
  renderLeaderboard();
});

socket.on('game_start', () => {
  elapsedSeconds = 0;
  entries = [];
  setStatus('playing');
  renderLeaderboard();
});

socket.on('game_end', (message) => {
  entries = (message.entries as LeaderboardEntry[] | undefined) ?? entries;
  setStatus('ended');
  renderLeaderboard();
});

startBtn.addEventListener('click', () => {
  elapsedSeconds = 0;
  socket.startGame();
});

endBtn.addEventListener('click', () => {
  socket.endGame();
});

renderPlayers();
renderLeaderboard();
renderStatus();
