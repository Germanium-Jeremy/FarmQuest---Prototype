import { CHARACTER_OPTIONS, CharacterType } from '../../data/CharacterOptions';
import { buttonStyle } from '../components/Button';
import { goldCardStyle } from '../theme';
import { Screen } from './Screen';

export class CharacterSelectScreen extends Screen {
  show(
    data: { selected?: CharacterType } = {},
    callbacks: {
      onSelect: (type: CharacterType) => void;
      onConfirm: (type: CharacterType) => void;
    },
  ): void {
    const selected = data.selected ?? 'male';

    this.container.innerHTML = `
      <div style="${goldCardStyle}">
        <h1 style="font-size:clamp(28px,6vw,42px);margin:0 0 22px;font-weight:1000;">Choose Your Character</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:12px;margin-bottom:24px;">
          ${CHARACTER_OPTIONS.map((option) => {
            const active = option.type === selected;
            return `
              <button type="button" class="character-option" data-type="${option.type}" style="
                border:${active ? '3px solid #2f8f3a' : '3px solid transparent'};
                background:${active ? 'rgba(47,143,58,0.16)' : 'rgba(255,255,255,0.45)'};
                border-radius:18px;padding:16px 8px;cursor:pointer;min-height:120px;
                box-shadow:${active ? '0 0 0 3px #ffe36d' : 'none'};
              ">
                <div style="font-size:clamp(36px,8vw,52px);line-height:1;">${option.icon}</div>
                <div style="margin-top:8px;font-weight:1000;color:#193620;font-size:clamp(13px,2.6vw,16px);">${option.label}</div>
              </button>
            `;
          }).join('')}
        </div>
        <button id="confirm-character" type="button" style="${buttonStyle('#2f8f3a')}">Select Character</button>
      </div>
    `;

    this.container.querySelectorAll<HTMLButtonElement>('.character-option').forEach((button) => {
      button.addEventListener('click', () => callbacks.onSelect(button.dataset.type as CharacterType));
    });
    document.getElementById('confirm-character')!.addEventListener('click', () => callbacks.onConfirm(selected));
    this.reveal();
  }
}
