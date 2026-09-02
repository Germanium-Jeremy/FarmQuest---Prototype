import * as THREE from 'three';
import { CropType } from '../data/CropType';
import { MapId } from '../data/MapTheme';
import { MAP_SPAWNS, MapSpawnConfig, WaterSpawn } from '../data/MapSpawns';
import { GameTask } from '../game/GameTask';
import { TaskType } from '../data/TaskType';

export type SeedSpawn = {
  cropType: CropType;
  position: THREE.Vector3;
};

export type { WaterSpawn };

export class SpawnManager {
  private spawnConfig: MapSpawnConfig;

  constructor(mapId: MapId = 'rwanda') {
    this.spawnConfig = MAP_SPAWNS[mapId];
  }

  generateSeeds(tasks: GameTask[]): SeedSpawn[] {
    const requirements = tasks
      .filter((task) => task.type === TaskType.COLLECT_SEED || task.type === TaskType.COLLECT_MULTIPLE_SEEDS)
      .flatMap((task) => Array.from({ length: task.targetAmount }, () => task.cropType))
      .filter((cropType): cropType is CropType => Boolean(cropType));

    const positions = this.shuffle(this.spawnConfig.seedSpawnPoints).slice(0, requirements.length);
    return requirements.map((cropType, index) => ({ cropType, position: positions[index].clone() }));
  }

  generatePlots(count: number): THREE.Vector3[] {
    return this.shuffle(this.spawnConfig.plotPoints).slice(0, Math.max(1, Math.min(count, this.spawnConfig.plotPoints.length))).map((point) => point.clone());
  }

  chooseWaterSource(): WaterSpawn {
    const [choice] = this.shuffle(this.spawnConfig.waterSpawns);
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
