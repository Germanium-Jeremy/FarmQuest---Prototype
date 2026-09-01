import { CropType } from '../data/CropType';
import { TaskType } from '../data/TaskType';

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
