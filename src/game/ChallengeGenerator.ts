import { CROP_LABEL, CropType } from '../data/CropType';
import { LEVEL_CONFIG, LevelConfig } from '../data/LevelConfig';
import { TaskType } from '../data/TaskType';
import { GameTask } from './GameTask';

type CropRequirement = {
  cropType: CropType;
  amount: number;
};

type Template = {
  id: string;
  crops: CropRequirement[];
  waterActions: number;
};

const randomInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

export class ChallengeGenerator {
  generate(levelNumber = 1): GameTask[] {
    const level = LEVEL_CONFIG.find((config) => config.id === levelNumber) ?? LEVEL_CONFIG[0];
    const templates = this.getTemplates(level);
    const source = templates[randomInt(0, templates.length - 1)];
    const crops = source.crops.map((crop) => ({
      cropType: crop.cropType,
      amount: Math.min(level.id + 2, Math.max(1, crop.amount + (level.id === 1 ? 0 : randomInt(0, 1)))),
    }));

    const totalSeeds = crops.reduce((sum, crop) => sum + crop.amount, 0);
    const waterActions = Math.min(2, Math.max(1, source.waterActions + (level.id === 3 ? 0 : randomInt(0, 1))));
    const tasks: GameTask[] = [];

    for (const crop of crops) {
      const itemName = crop.cropType === CropType.COFFEE
        ? (crop.amount === 1 ? 'bean' : 'beans')
        : (crop.amount === 1 ? 'seed' : 'seeds');
      tasks.push(this.task({
        id: `${source.id}-collect-${crop.cropType}`,
        type: crop.amount === 1 ? TaskType.COLLECT_SEED : TaskType.COLLECT_MULTIPLE_SEEDS,
        cropType: crop.cropType,
        amount: crop.amount,
        timeLimit: 20 + crop.amount * 8,
        reward: this.reward(level, 80 + crop.amount * 40),
        description: `Find ${crop.amount} ${CROP_LABEL[crop.cropType]} ${itemName}`,
      }));
    }

    tasks.push(this.task({
      id: `${source.id}-plant`,
      type: totalSeeds === 1 ? TaskType.PLANT_SEED : TaskType.PLANT_MULTIPLE_SEEDS,
      amount: totalSeeds,
      timeLimit: 25 + totalSeeds * 6,
      reward: this.reward(level, 100 + totalSeeds * 30),
      description: totalSeeds === 1 ? 'Plant your seed in a farm plot' : `Plant ${totalSeeds} collected seeds`,
    }));

    tasks.push(this.task({
      id: `${source.id}-water-source`,
      type: TaskType.FIND_WATER,
      amount: 1,
      timeLimit: 25,
      reward: this.reward(level, 100),
      description: 'Find the active water source',
    }));

    tasks.push(this.task({
      id: `${source.id}-water-crops`,
      type: waterActions === 1 ? TaskType.WATER_CROP : TaskType.WATER_CROP_MULTIPLE,
      amount: totalSeeds * waterActions,
      timeLimit: 25 + totalSeeds * waterActions * 6,
      reward: this.reward(level, 100 + totalSeeds * waterActions * 35),
      description: waterActions === 1 ? 'Water every planted crop' : `Water crops ${waterActions} times each`,
    }));

    tasks.push(this.task({
      id: `${source.id}-harvest`,
      type: totalSeeds === 1 ? TaskType.HARVEST_CROP : TaskType.HARVEST_MULTIPLE,
      amount: totalSeeds,
      timeLimit: 25 + totalSeeds * 6,
      reward: this.reward(level, 150 + totalSeeds * 50),
      description: totalSeeds === 1 ? 'Harvest your crop' : `Harvest ${totalSeeds} ready crops`,
    }));

    return tasks;
  }

  private getTemplates(level: LevelConfig): Template[] {
    if (level.id === 1) {
      const cropType = level.crops[randomInt(0, level.crops.length - 1)];
      return [{ id: `level-1-${cropType}`, crops: [{ cropType, amount: 1 }], waterActions: 1 }];
    }

    if (level.id === 2) {
      return [
        {
          id: 'level-2-maize-cassava',
          crops: [
            { cropType: CropType.MAIZE, amount: 2 },
            { cropType: CropType.CASSAVA, amount: 1 },
          ],
          waterActions: 1,
        },
        {
          id: 'level-2-cassava-coffee',
          crops: [
            { cropType: CropType.CASSAVA, amount: 2 },
            { cropType: CropType.COFFEE, amount: 1 },
          ],
          waterActions: 1,
        },
      ];
    }

    return [
      {
        id: 'level-3-full-harvest',
        crops: [
          { cropType: CropType.MAIZE, amount: 3 },
          { cropType: CropType.CASSAVA, amount: 2 },
          { cropType: CropType.COFFEE, amount: 2 },
        ],
        waterActions: 2,
      },
      {
        id: 'level-3-market-rush',
        crops: [
          { cropType: CropType.MAIZE, amount: 2 },
          { cropType: CropType.CASSAVA, amount: 3 },
          { cropType: CropType.COFFEE, amount: 1 },
        ],
        waterActions: 2,
      },
    ];
  }

  private reward(level: LevelConfig, baseReward: number): number {
    return Math.round(baseReward * level.rewardMultiplier);
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
