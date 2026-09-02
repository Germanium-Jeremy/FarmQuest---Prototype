import { getCharacterOption, CharacterType } from '../../data/CharacterOptions';
import { getMapOption, MapId } from '../../data/MapOptions';
import { goldCardStyle } from '../theme';
import { Screen } from './Screen';

export class LobbyScreen extends Screen {
  show(data: {
    playerCount: number;
    characterType: CharacterType;
    mapId: MapId;
    displayName?: string;
  }): void {
    this.render(data);
    this.reveal();
  }

  updatePlayerCount(playerCount: number, characterType: CharacterType, mapId: MapId, displayName?: string): void {
    if (this.container.style.display === 'none') return;
    this.render({ playerCount, characterType, mapId, displayName });
    this.reveal();
  }

  private render(data: {
    playerCount: number;
    characterType: CharacterType;
    mapId: MapId;
    displayName?: string;
  }): void {
    const character = getCharacterOption(data.characterType);
    const map = getMapOption(data.mapId);

    this.container.innerHTML = `
      <div style="${goldCardStyle}">
        <div style="font-size:clamp(36px,8vw,48px);margin-bottom:8px;">⏳</div>
        <h1 style="font-size:clamp(28px,6vw,42px);margin:0 0 18px;font-weight:1000;">Waiting To Start</h1>
        ${data.displayName ? `<p style="font-size:18px;font-weight:800;margin:0 0 10px;color:#315033;">Welcome, ${data.displayName}</p>` : ''}
        <p style="font-size:clamp(22px,4vw,28px);font-weight:1000;margin:0 0 18px;color:#2f8f3a;">
          Connected Players: ${data.playerCount}
        </p>
        <div style="text-align:left;background:rgba(255,255,255,0.45);border-radius:16px;padding:16px 18px;margin-bottom:18px;font-weight:800;">
          <div>Your Character: ${character.icon} ${character.label}</div>
          <div style="margin-top:8px;">Your Map: ${map.icon} ${map.name}</div>
        </div>
        <p style="font-size:clamp(16px,3vw,18px);margin:0 0 8px;font-weight:800;color:#315033;">
          The game will start when the admin begins the session.
        </p>
        <p style="font-size:clamp(16px,3vw,18px);margin:0;font-weight:1000;color:#193620;">Stay ready!</p>
      </div>
    `;
  }
}
