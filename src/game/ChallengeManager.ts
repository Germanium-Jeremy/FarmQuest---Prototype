import { CropType } from '../data/CropType';
import { TaskType } from '../data/TaskType';
import { ChallengeGenerator } from './ChallengeGenerator';
import { GameTask } from './GameTask';
import { ScoreManager } from './ScoreManager';

const matchingTypes = (expected: TaskType, actual: TaskType) => {
  if (expected === actual) return true;
  if (expected === TaskType.COLLECT_MULTIPLE_SEEDS && actual === TaskType.COLLECT_SEED) return true;
  if (expected === TaskType.PLANT_MULTIPLE_SEEDS && actual === TaskType.PLANT_SEED) return true;
  if (expected === TaskType.WATER_CROP_MULTIPLE && actual === TaskType.WATER_CROP) return true;
  if (expected === TaskType.HARVEST_MULTIPLE && actual === TaskType.HARVEST_CROP) return true;
  return false;
};

export class ChallengeManager {
  private tasks: GameTask[] = [];
  private currentIndex = 0;
  private timeRemaining = 0;
  private active = false;
  private paused = false;
  private generator = new ChallengeGenerator();
  private onTimeout: (() => void) | null = null;
  private onUpdate: (() => void) | null = null;
  private onComplete: (() => void) | null = null;
  private onFeedback: ((message: string) => void) | null = null;
  private onTaskStarted: ((task: GameTask, isFirstTask: boolean) => void) | null = null;
  private onTaskCompleted: ((completedTask: GameTask, nextTask: GameTask | null) => void) | null = null;

  constructor(private scoreManager: ScoreManager) {}

  start(
    levelNumber: number,
    onTimeout: () => void,
    onUpdate: () => void,
    onComplete: () => void,
    onFeedback: (message: string) => void,
    onTaskStarted?: (task: GameTask, isFirstTask: boolean) => void,
    onTaskCompleted?: (completedTask: GameTask, nextTask: GameTask | null) => void,
  ): GameTask[] {
    return this.startWithTasks(
      this.generator.generate(levelNumber),
      onTimeout,
      onUpdate,
      onComplete,
      onFeedback,
      onTaskStarted,
      onTaskCompleted,
    );
  }

  startWithTasks(
    tasks: GameTask[],
    onTimeout: () => void,
    onUpdate: () => void,
    onComplete: () => void,
    onFeedback: (message: string) => void,
    onTaskStarted?: (task: GameTask, isFirstTask: boolean) => void,
    onTaskCompleted?: (completedTask: GameTask, nextTask: GameTask | null) => void,
  ): GameTask[] {
    this.tasks = tasks.map((task) => ({ ...task, currentAmount: 0 }));
    this.currentIndex = 0;
    this.onTimeout = onTimeout;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.onFeedback = onFeedback;
    this.onTaskStarted = onTaskStarted ?? null;
    this.onTaskCompleted = onTaskCompleted ?? null;
    this.startCurrentTask();
    return this.tasks.map((task) => ({ ...task }));
  }

  startWithTasks(
    tasks: GameTask[],
    onTimeout: () => void,
    onUpdate: () => void,
    onComplete: () => void,
    onFeedback: (message: string) => void,
    onTaskStarted?: (task: GameTask, isFirstTask: boolean) => void,
    onTaskCompleted?: (completedTask: GameTask, nextTask: GameTask | null) => void,
  ): void {
<<<<<<< HEAD
    this.tasks = tasks;
=======
    this.tasks = tasks.map((task) => ({ ...task, currentAmount: 0 }));
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    this.currentIndex = 0;
    this.onTimeout = onTimeout;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.onFeedback = onFeedback;
    this.onTaskStarted = onTaskStarted ?? null;
    this.onTaskCompleted = onTaskCompleted ?? null;
    this.startCurrentTask();
  }

  getTasks(): GameTask[] {
    return this.tasks.map((task) => ({ ...task }));
  }

  getCurrentTask(): GameTask | null {
    const task = this.tasks[this.currentIndex];
    return task ? { ...task } : null;
  }

  getCompletedTaskCount(): number {
    return this.currentIndex;
  }

  getTaskCount(): number {
    return this.tasks.length;
  }

  getCurrentTaskRaw(): GameTask | null {
    return this.tasks[this.currentIndex] ?? null;
  }

  getTimeRemaining(): number {
    return Math.max(0, Math.ceil(this.timeRemaining));
  }

  isActive(): boolean {
    return this.active;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  registerProgress(type: TaskType, cropType?: CropType, amount = 1, feedback?: string): boolean {
    const task = this.getCurrentTaskRaw();
    if (!this.active || !task || !matchingTypes(task.type, type)) return false;
    if (task.cropType && cropType && task.cropType !== cropType) return false;

    task.currentAmount = Math.min(task.targetAmount, task.currentAmount + amount);
    if (feedback) this.onFeedback?.(feedback);

    if (task.currentAmount >= task.targetAmount) {
      this.completeCurrentTask();
    } else {
      this.onUpdate?.();
    }

    return true;
  }

  completeCurrentTask(): void {
    const task = this.getCurrentTaskRaw();
    if (!task) return;

    this.scoreManager.add(task.scoreReward);
    const completedTask = { ...task };
    this.currentIndex += 1;

    if (this.currentIndex >= this.tasks.length) {
      this.active = false;
      this.onTaskCompleted?.(completedTask, null);
      this.onComplete?.();
    } else {
      this.startCurrentTask();
      this.onTaskCompleted?.(completedTask, this.getCurrentTask());
    }
  }

  update(delta: number): void {
    if (!this.active || this.paused) return;
    this.timeRemaining -= delta;
    this.onUpdate?.();
    if (this.timeRemaining <= 0) {
      this.active = false;
      this.onTimeout?.();
    }
  }

  reset(): void {
    this.tasks = [];
    this.currentIndex = 0;
    this.timeRemaining = 0;
    this.active = false;
  }

  private startCurrentTask(): void {
    const task = this.getCurrentTaskRaw();
    if (!task) {
      this.active = false;
      this.onComplete?.();
      return;
    }
    this.timeRemaining = task.timeLimit;
    this.active = true;
    this.paused = false;
    this.onUpdate?.();
    this.onTaskStarted?.({ ...task }, this.currentIndex === 0);
  }
}
