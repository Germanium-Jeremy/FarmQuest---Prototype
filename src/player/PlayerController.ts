import { Player } from './Player';
import * as THREE from 'three';

export class PlayerController {
  private keys = new Set<string>();
  private interactPressed = false;
  private interactJustPressed = false;

  constructor() {
    this.setupKeyboard();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (this.isTypingTarget(e.target)) return;

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
      if (this.isTypingTarget(e.target)) return;

      this.keys.delete(e.code);
      if (e.code === 'KeyE' || e.code === 'Space') {
        this.interactPressed = false;
      }
    });
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable;
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

  update(
    delta: number,
    player: Player,
    worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    canMoveTo?: (position: THREE.Vector3, radius: number) => boolean,
  ): void {
    player.update(delta, this.keys, worldBounds, canMoveTo);
  }
}
