import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const uiOverlay = document.getElementById('ui-overlay') as HTMLDivElement;

const game = new Game(canvas, uiOverlay);

// Hook up start button after menu is shown
setTimeout(() => {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => game.startGame());
  }
}, 100);

// Game loop
function animate() {
  requestAnimationFrame(animate);
  game.update();
}

animate();
