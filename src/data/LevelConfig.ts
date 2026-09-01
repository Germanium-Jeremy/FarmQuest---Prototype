import { CropType } from './CropType';

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rewardMultiplier: number;
  introFact: string;
  crops: CropType[];
  baseAmounts: Partial<Record<CropType, number>>;
  waterActions: number;
}

export const LEVEL_CONFIG: LevelConfig[] = [
  {
    id: 1,
    name: 'Farming Basics',
    description: 'Learn the seed, plant, water, harvest cycle.',
    difficulty: 'Easy',
    rewardMultiplier: 1,
    introFact: 'Maize needs enough water during growth to develop healthy grain.',
    crops: [CropType.MAIZE, CropType.CASSAVA],
    baseAmounts: { [CropType.MAIZE]: 1, [CropType.CASSAVA]: 1 },
    waterActions: 1,
  },
  {
    id: 2,
    name: 'Growing More',
    description: 'Manage several crops and keep them watered.',
    difficulty: 'Medium',
    rewardMultiplier: 1.25,
    introFact: 'Cassava is mainly grown for its starchy roots and can handle dry conditions better than many crops.',
    crops: [CropType.MAIZE, CropType.CASSAVA, CropType.COFFEE],
    baseAmounts: { [CropType.MAIZE]: 2, [CropType.CASSAVA]: 1, [CropType.COFFEE]: 1 },
    waterActions: 1,
  },
  {
    id: 3,
    name: 'FarmQuest Challenge',
    description: 'Combine all your farming skills before time runs out.',
    difficulty: 'Hard',
    rewardMultiplier: 1.5,
    introFact: 'Coffee beans are seeds found inside coffee cherries.',
    crops: [CropType.MAIZE, CropType.CASSAVA, CropType.COFFEE],
    baseAmounts: { [CropType.MAIZE]: 3, [CropType.CASSAVA]: 2, [CropType.COFFEE]: 2 },
    waterActions: 2,
  },
];

export const TOTAL_LEVELS = LEVEL_CONFIG.length;
