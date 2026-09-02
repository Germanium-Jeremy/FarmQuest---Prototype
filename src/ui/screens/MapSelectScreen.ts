import { MAP_OPTIONS, MapId } from '../../data/MapOptions';
import { buttonStyle } from '../components/Button';
import { goldCardStyle } from '../theme';
import { Screen } from './Screen';

export class MapSelectScreen extends Screen {
  show(
    data: { selected?: MapId } = {},
    callbacks: {
      onSelect: (id: MapId) => void;
      onConfirm: (id: MapId) => void;
    },
  ): void {
    const selected = data.selected ?? 'rwanda';

    this.container.innerHTML = `
      <div style="${goldCardStyle}">
        <h1 style="font-size:clamp(28px,6vw,42px);margin:0 0 22px;font-weight:1000;">Select Your Map</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;margin-bottom:24px;">
          ${MAP_OPTIONS.map((option) => {
            const active = option.id === selected;
            return `
              <button type="button" class="map-option" data-id="${option.id}" style="
                border:${active ? '3px solid #2f8f3a' : '3px solid transparent'};
                background:${active ? 'rgba(47,143,58,0.16)' : 'rgba(255,255,255,0.45)'};
                border-radius:18px;padding:16px 8px;cursor:pointer;min-height:140px;
                box-shadow:${active ? '0 0 0 3px #ffe36d' : 'none'};
              ">
                <div style="font-size:clamp(36px,8vw,52px);line-height:1;">${option.icon}</div>
                <div style="margin-top:8px;font-weight:1000;color:#193620;font-size:clamp(14px,2.8vw,18px);">${option.name}</div>
                <div style="margin-top:4px;font-weight:800;color:#5d744d;font-size:clamp(12px,2.4vw,14px);">${option.description}</div>
              </button>
            `;
          }).join('')}
        </div>
        <button id="confirm-map" type="button" style="${buttonStyle('#2f8f3a')}">Select Map</button>
      </div>
    `;

    this.container.querySelectorAll<HTMLButtonElement>('.map-option').forEach((button) => {
      button.addEventListener('click', () => callbacks.onSelect(button.dataset.id as MapId));
    });
    document.getElementById('confirm-map')!.addEventListener('click', () => callbacks.onConfirm(selected));
    this.reveal();
  }
}
