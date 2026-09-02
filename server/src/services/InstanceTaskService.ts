import { randomUUID } from 'node:crypto';

type CropType = 'maize' | 'cassava' | 'coffee';
type TaskType =
  | 'collect_seed'
  | 'collect_multiple_seeds'
  | 'plant_seed'
  | 'plant_multiple_seeds'
  | 'find_water'
  | 'water_crop'
  | 'water_crop_multiple'
  | 'harvest_crop'
  | 'harvest_multiple';

export interface GameTask {
  id: string;
  type: TaskType;
  cropType?: CropType;
  targetAmount: number;
  currentAmount: number;
  timeLimit: number;
  scoreReward: number;
  description: string;
}

const labels: Record<CropType, string> = {
  maize: 'Maize',
  cassava: 'Cassava',
  coffee: 'Coffee',
};

const templates: CropType[][] = [
  ['maize', 'cassava'],
  ['cassava', 'coffee'],
  ['maize', 'coffee'],
  ['maize', 'cassava', 'coffee'],
];

const randomInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

export class InstanceTaskService {
  createInstance(): { instanceId: string; tasks: GameTask[] } {
    const instanceId = randomUUID();
    const crops = templates[randomInt(0, templates.length - 1)].map((cropType) => ({
      cropType,
      amount: randomInt(1, cropType === 'coffee' ? 2 : 3),
    }));
    const totalSeeds = crops.reduce((sum, crop) => sum + crop.amount, 0);
    const waterActions = randomInt(1, 2);
    const tasks: GameTask[] = [];

    for (const crop of crops) {
      const itemName = crop.cropType === 'coffee'
        ? (crop.amount === 1 ? 'bean' : 'beans')
        : (crop.amount === 1 ? 'seed' : 'seeds');
      tasks.push(this.task({
        id: `${instanceId}-collect-${crop.cropType}`,
        type: crop.amount === 1 ? 'collect_seed' : 'collect_multiple_seeds',
        cropType: crop.cropType,
        amount: crop.amount,
        timeLimit: 22 + crop.amount * 8,
        reward: 90 + crop.amount * 45,
        description: `Find ${crop.amount} ${labels[crop.cropType]} ${itemName}`,
      }));
    }

    tasks.push(this.task({
      id: `${instanceId}-plant`,
      type: totalSeeds === 1 ? 'plant_seed' : 'plant_multiple_seeds',
      amount: totalSeeds,
      timeLimit: 28 + totalSeeds * 6,
      reward: 120 + totalSeeds * 35,
      description: totalSeeds === 1 ? 'Plant your seed in a farm plot' : `Plant ${totalSeeds} collected seeds`,
    }));

    tasks.push(this.task({
      id: `${instanceId}-water-source`,
      type: 'find_water',
      amount: 1,
      timeLimit: 25,
      reward: 100,
      description: 'Find the active water source',
    }));

    tasks.push(this.task({
      id: `${instanceId}-water-crops`,
      type: waterActions === 1 ? 'water_crop' : 'water_crop_multiple',
      amount: totalSeeds * waterActions,
      timeLimit: 28 + totalSeeds * waterActions * 6,
      reward: 120 + totalSeeds * waterActions * 40,
      description: waterActions === 1 ? 'Water every planted crop' : `Water crops ${waterActions} times each`,
    }));

    tasks.push(this.task({
      id: `${instanceId}-harvest`,
      type: totalSeeds === 1 ? 'harvest_crop' : 'harvest_multiple',
      amount: totalSeeds,
      timeLimit: 28 + totalSeeds * 6,
      reward: 180 + totalSeeds * 55,
      description: totalSeeds === 1 ? 'Harvest your crop' : `Harvest ${totalSeeds} ready crops`,
    }));

    return { instanceId, tasks };
  }

  private task(config: {
    id: string;
    type: TaskType;
    amount: number;
    timeLimit: number;
    reward: number;
    description: string;
    cropType?: CropType;
  }): GameTask {
    return {
      id: config.id,
      type: config.type,
      cropType: config.cropType,
      targetAmount: config.amount,
      currentAmount: 0,
      timeLimit: config.timeLimit,
      scoreReward: config.reward,
      description: config.description,
    };
  }
}
