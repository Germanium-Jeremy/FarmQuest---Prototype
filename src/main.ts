import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const uiOverlay = document.getElementById('ui-overlay') as HTMLDivElement;

const game = new Game(canvas, uiOverlay);

// Game loop
function animate() {
  requestAnimationFrame(animate);
  game.update();
}

animate();
