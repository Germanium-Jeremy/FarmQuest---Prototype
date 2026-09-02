export type MapId = 'rwanda' | 'sudan' | 'seychelles';

export interface MapOption {
  id: MapId;
  name: string;
  description: string;
  icon: string;
  groundColor: number;
  skyColor: number;
  treeColor: number;
  waterColor: number;
}

export const MAP_OPTIONS: MapOption[] = [
  {
    id: 'rwanda',
    name: 'Rwanda',
    description: 'Wet Land',
    icon: '🌧️',
    groundColor: 0x7ec850,
    skyColor: 0x8fd3ff,
    treeColor: 0x228b22,
    waterColor: 0x3498db,
  },
  {
    id: 'sudan',
    name: 'Sudan',
    description: 'Desert',
    icon: '🏜️',
    groundColor: 0xd4b896,
    skyColor: 0xf0e68c,
    treeColor: 0x8b7355,
    waterColor: 0x5dade2,
  },
  {
    id: 'seychelles',
    name: 'Seychelles',
    description: 'Water Land',
    icon: '🌊',
    groundColor: 0xf4e1c1,
    skyColor: 0x87ceeb,
    treeColor: 0x2ecc71,
    waterColor: 0x1abc9c,
  },
];

export const getMapOption = (id: MapId): MapOption =>
  MAP_OPTIONS.find((option) => option.id === id) ?? MAP_OPTIONS[0];
