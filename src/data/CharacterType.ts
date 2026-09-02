export type CharacterType = 'male' | 'female' | 'robot';

export interface CharacterOption {
  type: CharacterType;
  label: string;
  icon: string;
  bodyColor: number;
  skinColor: number;
  accentColor: number;
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  { type: 'male', label: 'Male', icon: '👨', bodyColor: 0x4a90d9, skinColor: 0xf5cba7, accentColor: 0x8B4513 },
  { type: 'female', label: 'Female', icon: '👩', bodyColor: 0x9b59b6, skinColor: 0xf0c8a0, accentColor: 0xff69b4 },
  { type: 'robot', label: 'Robot', icon: '🤖', bodyColor: 0x95a5a6, skinColor: 0xbdc3c7, accentColor: 0x00ff88 },
];
