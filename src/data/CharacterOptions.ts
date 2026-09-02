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
  {
    type: 'male',
    label: 'Male',
    icon: '👨',
    bodyColor: 0x4a90d9,
    skinColor: 0xf5cba7,
    accentColor: 0x8b5a2b,
  },
  {
    type: 'female',
    label: 'Female',
    icon: '👩',
    bodyColor: 0x9b59b6,
    skinColor: 0xf0c8a0,
    accentColor: 0xf5a3c7,
  },
  {
    type: 'robot',
    label: 'Robot',
    icon: '🤖',
    bodyColor: 0x95a5a6,
    skinColor: 0xbdc3c7,
    accentColor: 0x00e5ff,
  },
];

export const getCharacterOption = (type: CharacterType): CharacterOption =>
  CHARACTER_OPTIONS.find((option) => option.type === type) ?? CHARACTER_OPTIONS[0];
