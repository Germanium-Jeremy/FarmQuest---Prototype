import { overlayScreenStyle } from '../theme';

export class Screen {
  protected container: HTMLElement;

  constructor(protected overlay: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = overlayScreenStyle;
    this.overlay.appendChild(this.container);
  }

  hide(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  destroy(): void {
    this.container.remove();
  }

  protected reveal(): void {
    this.container.style.display = 'flex';
  }
}
