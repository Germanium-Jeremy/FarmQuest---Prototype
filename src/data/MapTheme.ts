export type MapId = 'rwanda' | 'sudan' | 'seychelles';

export interface MapTheme {
  id: MapId;
  name: string;
  description: string;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  dirtColor: number;
  roadColor: number;
  treeTrunkColor: number;
  treeFoliageColors: number[];
  waterColor: number;
  waterOpacity: number;
  buildingWallColor: number;
  buildingRoofColor: number;
  fenceColor: number;
  ambientIntensity: number;
  sunIntensity: number;
  hemisphereSkyColor: number;
  hemisphereGroundColor: number;
}

const RWANDA_THEME: MapTheme = {
  id: 'rwanda',
  name: 'Rwanda - Wet Land',
  description: 'Lush green hills and fertile farmland',
  skyColor: 0x8fd3ff,
  fogColor: 0x8fd3ff,
  groundColor: 0x7ec850,
  dirtColor: 0xc4a55a,
  roadColor: 0x888888,
  treeTrunkColor: 0x8B4513,
  treeFoliageColors: [0x228B22, 0x2d8b2d, 0x1a7a1a],
  waterColor: 0x3498db,
  waterOpacity: 0.8,
  buildingWallColor: 0xdeb887,
  buildingRoofColor: 0x8B4513,
  fenceColor: 0x8B4513,
  ambientIntensity: 0.62,
  sunIntensity: 1.0,
  hemisphereSkyColor: 0x8fd3ff,
  hemisphereGroundColor: 0x7ec850,
};

const SUDAN_THEME: MapTheme = {
  id: 'sudan',
  name: 'Sudan - Desert',
  description: 'Hot, dry desert farmland near an oasis',
  skyColor: 0xf0e68c,
  fogColor: 0xf0e68c,
  groundColor: 0xd4b896,
  dirtColor: 0xc9a96e,
  roadColor: 0xb8a088,
  treeTrunkColor: 0x8B7355,
  treeFoliageColors: [0x8B7355, 0x9e8b6e, 0x7a6b4e],
  waterColor: 0x4fa4c7,
  waterOpacity: 0.6,
  buildingWallColor: 0xd2b48c,
  buildingRoofColor: 0x8B4513,
  fenceColor: 0x8B7355,
  ambientIntensity: 0.7,
  sunIntensity: 1.3,
  hemisphereSkyColor: 0xf0e68c,
  hemisphereGroundColor: 0xd4b896,
};

const SEYCHELLES_THEME: MapTheme = {
  id: 'seychelles',
  name: 'Seychelles - Water Land',
  description: 'Tropical island with crystal clear waters',
  skyColor: 0x87ceeb,
  fogColor: 0x87ceeb,
  groundColor: 0xf4e1c1,
  dirtColor: 0xd2b48c,
  roadColor: 0xc9b896,
  treeTrunkColor: 0x8B6914,
  treeFoliageColors: [0x2ecc71, 0x27ae60, 0x1abc9c],
  waterColor: 0x1abc9c,
  waterOpacity: 0.7,
  buildingWallColor: 0xf5f5dc,
  buildingRoofColor: 0xcd853f,
  fenceColor: 0x8B6914,
  ambientIntensity: 0.65,
  sunIntensity: 1.1,
  hemisphereSkyColor: 0x87ceeb,
  hemisphereGroundColor: 0xf4e1c1,
};

export const MAP_THEMES: Record<MapId, MapTheme> = {
  rwanda: RWANDA_THEME,
  sudan: SUDAN_THEME,
  seychelles: SEYCHELLES_THEME,
};

export const MAP_OPTIONS: { id: MapId; name: string; description: string; icon: string }[] = [
  { id: 'rwanda', name: 'Rwanda', description: 'Wet Land', icon: '🌧️' },
  { id: 'sudan', name: 'Sudan', description: 'Desert', icon: '🏜️' },
  { id: 'seychelles', name: 'Seychelles', description: 'Water Land', icon: '🌊' },
];
