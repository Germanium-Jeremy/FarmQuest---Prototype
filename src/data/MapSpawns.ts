import * as THREE from 'three';
import { MapId } from './MapTheme';

export type WaterSpawn = {
  name: string;
  position: THREE.Vector3;
};

export interface MapSpawnConfig {
  seedSpawnPoints: THREE.Vector3[];
  plotPoints: THREE.Vector3[];
  waterSpawns: WaterSpawn[];
}

export const MAP_SPAWNS: Record<MapId, MapSpawnConfig> = {
  rwanda: {
    seedSpawnPoints: [
      new THREE.Vector3(-10, 0, -5),
      new THREE.Vector3(-13, 0, -2),
      new THREE.Vector3(-7, 0, 1),
      new THREE.Vector3(1, 0, -8),
      new THREE.Vector3(10, 0, -7),
      new THREE.Vector3(12, 0, 3),
      new THREE.Vector3(-8, 0, 8),
      new THREE.Vector3(4, 0, 8),
      new THREE.Vector3(9, 0, 6),
      new THREE.Vector3(2, 0, 1),
    ],
    plotPoints: [
      new THREE.Vector3(4.6, 0, -4.2),
      new THREE.Vector3(6.2, 0, -4.2),
      new THREE.Vector3(7.8, 0, -4.2),
      new THREE.Vector3(4.6, 0, -2.4),
      new THREE.Vector3(6.2, 0, -2.4),
      new THREE.Vector3(7.8, 0, -2.4),
      new THREE.Vector3(4.6, 0, -0.6),
      new THREE.Vector3(6.2, 0, -0.6),
      new THREE.Vector3(7.8, 0, -0.6),
    ],
    waterSpawns: [
      { name: 'Farm Well', position: new THREE.Vector3(11, 0, 0) },
      { name: 'Forest Pump', position: new THREE.Vector3(-12, 0, -11) },
      { name: 'Road Barrel', position: new THREE.Vector3(-2, 0, 5.8) },
      { name: 'River Pump', position: new THREE.Vector3(14, 0, 7) },
    ],
  },
  sudan: {
    seedSpawnPoints: [
      new THREE.Vector3(-8, 0, -3),
      new THREE.Vector3(-11, 0, 0),
      new THREE.Vector3(2, 0, -6),
      new THREE.Vector3(8, 0, -5),
      new THREE.Vector3(10, 0, 2),
      new THREE.Vector3(-6, 0, 6),
      new THREE.Vector3(3, 0, 7),
      new THREE.Vector3(7, 0, 5),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(-3, 0, 3),
    ],
    plotPoints: [
      new THREE.Vector3(5, 0, -3),
      new THREE.Vector3(6.5, 0, -3),
      new THREE.Vector3(8, 0, -3),
      new THREE.Vector3(5, 0, -1.5),
      new THREE.Vector3(6.5, 0, -1.5),
      new THREE.Vector3(8, 0, -1.5),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(6.5, 0, 0),
      new THREE.Vector3(8, 0, 0),
    ],
    waterSpawns: [
      { name: 'Oasis Pool', position: new THREE.Vector3(12, 0, 5) },
      { name: 'Water Tank', position: new THREE.Vector3(-8, 0, 7) },
      { name: 'Village Well', position: new THREE.Vector3(0, 0, -8) },
      { name: 'Pump Station', position: new THREE.Vector3(-10, 0, -4) },
    ],
  },
  seychelles: {
    seedSpawnPoints: [
      new THREE.Vector3(-8, 0, -4),
      new THREE.Vector3(-11, 0, -1),
      new THREE.Vector3(1, 0, -7),
      new THREE.Vector3(9, 0, -6),
      new THREE.Vector3(11, 0, 3),
      new THREE.Vector3(-7, 0, 7),
      new THREE.Vector3(4, 0, 7),
      new THREE.Vector3(8, 0, 5),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-4, 0, 4),
    ],
    plotPoints: [
      new THREE.Vector3(4.5, 0, -3.5),
      new THREE.Vector3(6, 0, -3.5),
      new THREE.Vector3(7.5, 0, -3.5),
      new THREE.Vector3(4.5, 0, -2),
      new THREE.Vector3(6, 0, -2),
      new THREE.Vector3(7.5, 0, -2),
      new THREE.Vector3(4.5, 0, -0.5),
      new THREE.Vector3(6, 0, -0.5),
      new THREE.Vector3(7.5, 0, -0.5),
    ],
    waterSpawns: [
      { name: 'Beach Tap', position: new THREE.Vector3(14, 0, 6) },
      { name: 'Coconut Well', position: new THREE.Vector3(-10, 0, -9) },
      { name: 'Pier Pump', position: new THREE.Vector3(13, 0, 0) },
      { name: 'Village Tank', position: new THREE.Vector3(-3, 0, 8) },
    ],
  },
};
