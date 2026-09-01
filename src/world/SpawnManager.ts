import * as THREE from 'three';
import { CropType } from '../data/CropType';
import { GameTask } from '../game/GameTask';
import { TaskType } from '../data/TaskType';

export type SeedSpawn = {
  cropType: CropType;
  position: THREE.Vector3;
};

export type WaterSpawn = {
  name: string;
  position: THREE.Vector3;
};

const seedSpawnPoints = [
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
];

const plotPoints = [
  new THREE.Vector3(4.6, 0, -4.2),
  new THREE.Vector3(6.2, 0, -4.2),
  new THREE.Vector3(7.8, 0, -4.2),
  new THREE.Vector3(4.6, 0, -2.4),
  new THREE.Vector3(6.2, 0, -2.4),
  new THREE.Vector3(7.8, 0, -2.4),
  new THREE.Vector3(4.6, 0, -0.6),
  new THREE.Vector3(6.2, 0, -0.6),
  new THREE.Vector3(7.8, 0, -0.6),
];

const waterSpawns: WaterSpawn[] = [
  { name: 'Farm Well', position: new THREE.Vector3(11, 0, 0) },
  { name: 'Forest Pump', position: new THREE.Vector3(-12, 0, -11) },
  { name: 'Road Barrel', position: new THREE.Vector3(-2, 0, 5.8) },
  { name: 'River Pump', position: new THREE.Vector3(14, 0, 7) },
];

export class SpawnManager {
  generateSeeds(tasks: GameTask[]): SeedSpawn[] {
    const requirements = tasks
      .filter((task) => task.type === TaskType.COLLECT_SEED || task.type === TaskType.COLLECT_MULTIPLE_SEEDS)
      .flatMap((task) => Array.from({ length: task.targetAmount }, () => task.cropType))
      .filter((cropType): cropType is CropType => Boolean(cropType));

    const positions = this.shuffle(seedSpawnPoints).slice(0, requirements.length);
    return requirements.map((cropType, index) => ({ cropType, position: positions[index].clone() }));
  }

  generatePlots(count: number): THREE.Vector3[] {
    return this.shuffle(plotPoints).slice(0, Math.max(1, Math.min(count, plotPoints.length))).map((point) => point.clone());
  }

  chooseWaterSource(): WaterSpawn {
    const [choice] = this.shuffle(waterSpawns);
    return { name: choice.name, position: choice.position.clone() };
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
