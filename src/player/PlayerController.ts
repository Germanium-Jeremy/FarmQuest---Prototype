import { Player } from './Player';

export class PlayerController {
  private keys = new Set<string>();
  private interactPressed = false;
  private interactJustPressed = false;

  constructor() {
    this.setupKeyboard();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        if (!this.interactPressed) {
          this.interactJustPressed = true;
        }
        this.interactPressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'KeyE' || e.code === 'Space') {
        this.interactPressed = false;
      }
    });
  }

  getKeys(): Set<string> {
    return this.keys;
  }

  consumeInteract(): boolean {
    if (this.interactJustPressed) {
      this.interactJustPressed = false;
      return true;
    }
    return false;
  }

  update(delta: number, player: Player, worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    player.update(delta, this.keys, worldBounds);
  }
}
