import { CropType } from '../data/CropType';
import { TaskType } from '../data/TaskType';
import { GameTask } from '../game/GameTask';
import { ScoreManager } from '../game/ScoreManager';
import { buttonStyle } from './components/Button';

export interface HUDMeta {
  taskNumber?: number;
  taskCount?: number;
  playerCount?: number;
  elapsedSeconds?: number;
}

const taskIcon = (task: GameTask | null) => {
  if (!task) return '🌱';
  if (task.type === TaskType.FIND_WATER || task.type === TaskType.WATER_CROP || task.type === TaskType.WATER_CROP_MULTIPLE) return '💧';
  if (task.type === TaskType.PLANT_SEED || task.type === TaskType.PLANT_MULTIPLE_SEEDS) return '🌱';
  if (task.type === TaskType.HARVEST_CROP || task.type === TaskType.HARVEST_MULTIPLE) return '🌾';
  if (task.cropType === CropType.COFFEE) return '☕';
  if (task.cropType === CropType.CASSAVA) return '🌿';
  return '🌽';
};

const titleCase = (text: string) => text.replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};

export class HUD {
  private hudEl: HTMLElement;
  private promptEl: HTMLElement;
  private screenEl: HTMLElement;
  private feedbackEl: HTMLElement;
  private taskModalEl: HTMLElement;
  private feedbackTimer = 0;
  private transitionTimer: number | null = null;

  constructor(private overlay: HTMLElement, private scoreManager: ScoreManager) {
    this.overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;font-family:Segoe UI,Tahoma,sans-serif;';

    this.hudEl = document.createElement('div');
    this.hudEl.style.cssText = `
      position:absolute;top:16px;left:50%;transform:translateX(-50%);
      width:min(94vw,620px);background:linear-gradient(135deg,rgba(20,43,27,0.94),rgba(32,65,42,0.9));
      color:white;border:2px solid rgba(255,232,126,0.42);border-radius:18px;padding:15px 18px;
      box-shadow:0 18px 42px rgba(0,0,0,0.26);display:none;pointer-events:none;overflow:hidden;
    `;
    this.overlay.appendChild(this.hudEl);

    this.promptEl = document.createElement('div');
    this.promptEl.style.cssText = `
      position:absolute;bottom:72px;left:50%;transform:translateX(-50%);
      background:rgba(18,24,20,0.9);color:#ffe36d;padding:12px 22px;border-radius:999px;
      font-size:18px;font-weight:900;border:2px solid #ffe36d;display:none;pointer-events:none;
      box-shadow:0 12px 26px rgba(0,0,0,0.22);
    `;
    this.overlay.appendChild(this.promptEl);

    this.feedbackEl = document.createElement('div');
    this.feedbackEl.style.cssText = `
      position:absolute;top:165px;left:50%;transform:translateX(-50%);
      width:min(90vw,420px);background:#fffdf2;color:#173320;border-left:8px solid #52a447;
      border-radius:14px;padding:13px 16px;font-size:18px;font-weight:900;display:none;
      box-shadow:0 14px 34px rgba(0,0,0,0.2);pointer-events:none;text-align:center;
    `;
    this.overlay.appendChild(this.feedbackEl);

    this.taskModalEl = document.createElement('div');
    this.taskModalEl.style.cssText = `
      position:absolute;inset:0;display:none;justify-content:center;align-items:center;
      background:radial-gradient(circle at 50% 42%,rgba(63,117,67,0.28),rgba(8,13,10,0.58));
      pointer-events:all;color:white;text-align:center;padding:20px;z-index:15;
    `;
    this.overlay.appendChild(this.taskModalEl);

    this.screenEl = document.createElement('div');
    this.screenEl.style.cssText = `
      position:absolute;inset:0;display:none;justify-content:center;align-items:center;
      background:rgba(12,19,15,0.86);pointer-events:all;color:white;text-align:center;padding:24px;z-index:15;
    `;
    this.overlay.appendChild(this.screenEl);
  }

  updateHUD(task: GameTask | null, timeRemaining: number, meta: HUDMeta = {}): void {
    if (!task) return;
    this.hudEl.style.display = 'block';
    const lowTime = timeRemaining <= 8;
    const progress = Math.round((task.currentAmount / task.targetAmount) * 100);
    const taskNumber = meta.taskNumber ?? 1;
    const taskCount = meta.taskCount ?? 1;
    const elapsed = meta.elapsedSeconds ?? 0;
    const playerCount = meta.playerCount;

    this.hudEl.innerHTML = `
      <div style="display:flex;gap:14px;align-items:center;">
        <div style="font-size:42px;line-height:1;background:rgba(255,255,255,0.13);border-radius:14px;padding:9px 12px;">${taskIcon(task)}</div>
        <div style="flex:1;min-width:0;text-align:left;">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:3px;">
            <div style="font-size:12px;font-weight:1000;letter-spacing:0;color:#bff28a;">CURRENT TASK</div>
            <div style="font-size:13px;font-weight:1000;color:#ffe36d;">TASK ${taskNumber} OF ${taskCount}</div>
          </div>
          <div style="font-size:clamp(22px,4vw,32px);line-height:1.08;font-weight:1000;margin-bottom:11px;">${titleCase(task.description)}</div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
            <div style="height:13px;background:rgba(255,255,255,0.18);border-radius:999px;overflow:hidden;">
              <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#ffe36d,#8ee05d);border-radius:999px;"></div>
            </div>
            <div style="font-size:20px;font-weight:1000;color:#ffe36d;">${task.currentAmount} / ${task.targetAmount}</div>
          </div>
          <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:9px;font-size:17px;font-weight:900;">
            <span style="color:${lowTime ? '#ff766e' : '#bff28a'};">⏱ ${formatTime(timeRemaining)}</span>
            <span style="color:#d8f5c6;">🕒 ${formatTime(elapsed)}</span>
            <span style="color:#ffe36d;">⭐ Score ${this.scoreManager.getScore()}</span>
            ${playerCount != null ? `<span style="color:#bff28a;">PLAYERS: ${playerCount} connected</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  showFirstTask(task: GameTask, onStart: () => void, taskNumber = 1, taskCount = 1): void {
    this.hideHUD();
    this.showTaskCard({
      eyebrow: 'FarmQuest Event',
      kicker: `Task ${taskNumber} of ${taskCount}`,
      task,
      body: 'Complete the farming challenges before time runs out.',
      buttonText: 'Start Game',
      onButton: onStart,
    });
  }

  showTaskTransition(completedTask: GameTask, nextTask: GameTask | null, onDone: () => void): void {
    if (this.transitionTimer) window.clearTimeout(this.transitionTimer);
    this.hideHUD();
    this.taskModalEl.style.display = 'flex';
    this.taskModalEl.innerHTML = this.cardHTML({
      eyebrow: 'Task Complete!',
      icon: '✓',
      title: titleCase(completedTask.description),
      body: `Progress ${completedTask.targetAmount} / ${completedTask.targetAmount}. +${completedTask.scoreReward} points`,
    });

    this.transitionTimer = window.setTimeout(() => {
      if (!nextTask) {
        onDone();
        return;
      }
      this.taskModalEl.innerHTML = this.cardHTML({
        eyebrow: 'Next Task',
        icon: taskIcon(nextTask),
        title: titleCase(nextTask.description),
        body: `Progress ${nextTask.currentAmount} / ${nextTask.targetAmount}`,
      });
      this.transitionTimer = window.setTimeout(() => {
        this.hideTaskModal();
        onDone();
      }, 1500);
    }, 1150);
  }

  showPrompt(text: string): void {
    this.promptEl.style.display = 'block';
    this.promptEl.textContent = `[E] ${text}`;
  }

  hidePrompt(): void {
    this.promptEl.style.display = 'none';
  }

  showFeedback(message: string): void {
    this.feedbackEl.textContent = message;
    this.feedbackEl.style.display = 'block';
    this.feedbackTimer = 1.8;
  }

  update(delta: number): void {
    if (this.feedbackTimer <= 0) return;
    this.feedbackTimer -= delta;
    if (this.feedbackTimer <= 0) this.feedbackEl.style.display = 'none';
  }

  showMenu(onStart: () => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,620px);">
        <h1 style="font-size:clamp(44px,9vw,70px);margin:0 0 10px;font-weight:1000;">FarmQuest</h1>
        <p style="font-size:20px;color:#d9ead1;margin:0 0 34px;">Explore, collect seeds, plant crops, find water, harvest, and claim your reward.</p>
        <button id="start-btn" style="${buttonStyle('#52a447')}">Enter Event</button>
        <div style="margin-top:24px;color:#b8c9b2;font-size:15px;">WASD / Arrow Keys to move. E or Space to interact.</div>
      </div>
    `;
    document.getElementById('start-btn')!.addEventListener('click', onStart);
  }

  hideScreen(): void {
    this.screenEl.style.display = 'none';
  }

  hideHUD(): void {
    this.hudEl.style.display = 'none';
    this.promptEl.style.display = 'none';
  }

  hideTaskModal(): void {
    if (this.transitionTimer) window.clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
    this.taskModalEl.style.display = 'none';
  }

  private showTaskCard(config: {
    eyebrow: string;
    kicker: string;
    task: GameTask;
    body: string;
    buttonText: string;
    onButton: () => void;
  }): void {
    this.taskModalEl.style.display = 'flex';
    this.taskModalEl.innerHTML = this.cardHTML({
      eyebrow: config.eyebrow,
      kicker: config.kicker,
      icon: taskIcon(config.task),
      title: titleCase(config.task.description),
      body: `${config.body}<br>Progress ${config.task.currentAmount} / ${config.task.targetAmount}`,
      buttonText: config.buttonText,
    });
    document.getElementById('task-modal-button')!.addEventListener('click', config.onButton);
  }

  private cardHTML(config: { eyebrow: string; icon: string; title: string; body: string; kicker?: string; buttonText?: string }): string {
    return `
      <div style="
        width:min(90vw,540px);background:linear-gradient(145deg,#fdf8df,#f4df9b 58%,#e2bb56);
        color:#193620;border:3px solid #fff6c8;border-radius:24px;padding:26px 28px;
        box-shadow:0 24px 60px rgba(0,0,0,0.34);position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:auto -34px -48px auto;width:150px;height:150px;border-radius:50%;background:rgba(82,164,71,0.22);"></div>
        <div style="font-size:13px;font-weight:1000;color:#2f7a35;text-transform:uppercase;letter-spacing:0;">${config.eyebrow}</div>
        ${config.kicker ? `<div style="font-size:18px;font-weight:1000;margin-top:12px;color:#835c16;">${config.kicker}</div>` : ''}
        <div style="font-size:56px;line-height:1;margin:12px 0 8px;">${config.icon}</div>
        <h1 style="font-size:clamp(30px,7vw,46px);line-height:1.04;margin:0 0 14px;font-weight:1000;">${config.title}</h1>
        <p style="font-size:19px;line-height:1.35;margin:0 0 ${config.buttonText ? '22px' : '0'};font-weight:800;color:#315033;">${config.body}</p>
        ${config.buttonText ? `<button id="task-modal-button" style="${buttonStyle('#2f8f3a')}">${config.buttonText}</button>` : ''}
      </div>
    `;
  }
}
