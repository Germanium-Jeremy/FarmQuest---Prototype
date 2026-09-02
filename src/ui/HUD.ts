import { CropType } from '../data/CropType';
import { LevelConfig, TOTAL_LEVELS } from '../data/LevelConfig';
import { MAP_THEMES, MapId } from '../data/MapTheme';
import { TaskType } from '../data/TaskType';
import { GameTask } from '../game/GameTask';
import { ScoreManager } from '../game/ScoreManager';
import { CharacterType } from '../player/PlayerModel';

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

export class HUD {
  private hudEl: HTMLElement;
  private promptEl: HTMLElement;
  private screenEl: HTMLElement;
  private feedbackEl: HTMLElement;
  private taskModalEl: HTMLElement;
  private feedbackTimer = 0;
  private transitionTimer: number | null = null;

  constructor(private overlay: HTMLElement, private scoreManager: ScoreManager) {
    this.overlay.innerHTML = '';
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
      pointer-events:all;color:white;text-align:center;padding:20px;
    `;
    this.overlay.appendChild(this.taskModalEl);

    this.screenEl = document.createElement('div');
    this.screenEl.style.cssText = `
      position:absolute;inset:0;display:none;justify-content:center;align-items:center;
      background:rgba(12,19,15,0.86);pointer-events:all;color:white;text-align:center;padding:24px;
    `;
    this.overlay.appendChild(this.screenEl);
  }

  updateHUD(task: GameTask | null, timeRemaining: number, level?: LevelConfig, completedLevels: number[] = []): void {
    if (!task) return;
    this.hudEl.style.display = 'block';
    const timeStr = `${String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:${String(Math.floor(timeRemaining) % 60).padStart(2, '0')}`;
    const lowTime = timeRemaining <= 8;
    const progress = Math.round((task.currentAmount / task.targetAmount) * 100);
    this.hudEl.innerHTML = `
      <div style="display:flex;gap:14px;align-items:center;">
        <div style="font-size:42px;line-height:1;background:rgba(255,255,255,0.13);border-radius:14px;padding:9px 12px;">${taskIcon(task)}</div>
        <div style="flex:1;min-width:0;text-align:left;">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:3px;">
            <div style="font-size:12px;font-weight:1000;letter-spacing:0;color:#bff28a;">CURRENT TASK</div>
            ${level ? `<div style="font-size:13px;font-weight:1000;color:#ffe36d;">LEVEL ${level.id} OF ${TOTAL_LEVELS} - ${level.name}</div>` : ''}
          </div>
          <div style="font-size:clamp(22px,4vw,32px);line-height:1.08;font-weight:1000;margin-bottom:11px;">${titleCase(task.description)}</div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
            <div style="height:13px;background:rgba(255,255,255,0.18);border-radius:999px;overflow:hidden;">
              <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#ffe36d,#8ee05d);border-radius:999px;"></div>
            </div>
            <div style="font-size:20px;font-weight:1000;color:#ffe36d;">${task.currentAmount} / ${task.targetAmount}</div>
          </div>
          <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:9px;font-size:17px;font-weight:900;">
            <span style="color:${lowTime ? '#ff766e' : '#bff28a'};">⏱ ${timeStr}</span>
            <span style="color:#ffe36d;">⭐ Score ${this.scoreManager.getScore()}</span>
            <span style="color:#d8f5c6;">${this.progressDots(level?.id ?? 1, completedLevels)}</span>
          </div>
        </div>
      </div>
    `;
  }

  showRegistration(
    onRegister: (email: string, displayName?: string) => void,
    errorMessage = '',
    loading = false,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <form id="registration-form" style="width:min(92vw,560px);background:linear-gradient(145deg,#fdf8df,#ecd17a);color:#193620;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
        <h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 8px;font-weight:1000;">FarmQuest</h1>
        <p style="font-size:19px;margin:0 0 20px;font-weight:800;color:#315033;">Enter your email to start. We'll use it to send your FarmQuest reward if you complete the challenge.</p>
        <label style="display:block;text-align:left;font-weight:1000;margin:0 0 8px;">Email Address</label>
        <input id="email-input" type="email" autocomplete="email" placeholder="player@example.com" style="${this.inputStyle()}" />
        <label style="display:block;text-align:left;font-weight:1000;margin:14px 0 8px;">Display Name <span style="font-weight:700;color:#5d744d;">optional</span></label>
        <input id="name-input" type="text" maxlength="40" placeholder="Player" style="${this.inputStyle()}" />
        ${errorMessage ? `<div style="margin-top:14px;color:#b52828;font-weight:900;">${errorMessage}</div>` : ''}
        <button id="register-btn" type="submit" style="${this.buttonStyle('#2f8f3a')};margin-top:20px;" ${loading ? 'disabled' : ''}>${loading ? 'Starting...' : 'Start FarmQuest'}</button>
      </form>
    `;
    document.getElementById('registration-form')!.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = (document.getElementById('email-input') as HTMLInputElement).value;
      const displayName = (document.getElementById('name-input') as HTMLInputElement).value;
      onRegister(email, displayName);
    });
    for (const id of ['email-input', 'name-input']) {
      const input = document.getElementById(id);
      input?.addEventListener('keydown', (event) => event.stopPropagation());
      input?.addEventListener('keyup', (event) => event.stopPropagation());
    }
  }

  showLevelIntro(level: LevelConfig, firstTask: GameTask, onStart: () => void): void {
    this.hideHUD();
    this.showTaskCard({
      eyebrow: `Level ${level.id}`,
      kicker: level.name,
      task: firstTask,
      body: `${level.description}<br><strong>Farm Fact:</strong> ${level.introFact}<br>Your first task is ready.`,
      buttonText: `Start Level ${level.id}`,
      onButton: onStart,
    });
  }

  showCharacterSelect(onSelect: (type: CharacterType) => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,720px);background:linear-gradient(145deg,#fdf8df,#ecd17a);color:#193620;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
        <h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 10px;font-weight:1000;">Choose Your Farmer</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-top:22px;">
          ${this.choiceButton('character-male', 'Male', 'Blue overalls and straw hat')}
          ${this.choiceButton('character-female', 'Female', 'Purple outfit, hair bun and flower')}
          ${this.choiceButton('character-robot', 'Robot', 'Metal farmer with glowing lights')}
        </div>
      </div>
    `;
    document.getElementById('character-male')!.addEventListener('click', () => onSelect('male'));
    document.getElementById('character-female')!.addEventListener('click', () => onSelect('female'));
    document.getElementById('character-robot')!.addEventListener('click', () => onSelect('robot'));
  }

  showMapSelect(onSelect: (mapId: MapId) => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,780px);background:rgba(18,38,24,0.95);border:2px solid rgba(255,227,109,0.55);border-radius:22px;padding:26px;box-shadow:0 24px 60px rgba(0,0,0,0.32);">
        <h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 10px;color:#bff28a;">Choose Your Map</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:22px;">
          ${Object.values(MAP_THEMES).map((theme) => `
            <button id="map-${theme.id}" style="${this.choiceStyle()};background:linear-gradient(145deg,#${theme.groundColor.toString(16).padStart(6, '0')},#${theme.waterColor.toString(16).padStart(6, '0')});color:#102214;">
              <strong style="display:block;font-size:21px;margin-bottom:8px;">${theme.name}</strong>
              <span style="font-size:14px;font-weight:900;">${theme.description}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    for (const theme of Object.values(MAP_THEMES)) {
      document.getElementById(`map-${theme.id}`)!.addEventListener('click', () => onSelect(theme.id));
    }
  }

  showFirstTask(task: GameTask, onStart: () => void): void {
    this.hideHUD();
    this.showTaskCard({
      eyebrow: 'Welcome to FarmQuest',
      kicker: 'Your First Task',
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

  showLevelComplete(
    level: LevelConfig,
    nextLevel: LevelConfig | null,
    levelScore: number,
    totalScore: number,
    onContinue: () => void,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,600px);background:rgba(18,38,24,0.95);border:2px solid rgba(255,227,109,0.55);border-radius:22px;padding:26px;box-shadow:0 24px 60px rgba(0,0,0,0.32);">
        <h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 8px;color:#bff28a;">🎉 Level ${level.id} Complete!</h1>
        <p style="font-size:23px;margin:0 0 18px;font-weight:900;">${level.name} mastered</p>
        <p style="font-size:21px;color:#ffe36d;margin:0 0 6px;">Level Score: ⭐ ${levelScore}</p>
        <p style="font-size:21px;color:#ffe36d;margin:0 0 22px;">Total Score: ⭐ ${totalScore}</p>
        ${nextLevel ? `<div style="color:#e9f6e4;font-size:18px;margin-bottom:22px;">Next: Level ${nextLevel.id} - ${nextLevel.name}</div>` : ''}
        <button id="continue-level-btn" style="${this.buttonStyle('#52a447')}">${nextLevel ? `Continue to Level ${nextLevel.id}` : 'Prepare Reward'}</button>
      </div>
    `;
    document.getElementById('continue-level-btn')!.addEventListener('click', onContinue);
  }

  showLevelFailed(
    level: LevelConfig,
    completedTasks: number,
    totalTasks: number,
    totalScore: number,
    onRetryLevel: () => void,
    onRestart: () => void,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,580px);">
        <h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 10px;color:#ff766e;">Level Failed</h1>
        <p style="font-size:21px;color:#e9f6e4;margin:0 0 18px;">You ran out of time in Level ${level.id} - ${level.name}.</p>
        <p style="font-size:20px;color:#ffe36d;margin:0 0 8px;">Completed Tasks: ${completedTasks} / ${totalTasks}</p>
        <p style="font-size:24px;color:#ffe36d;margin:0 0 26px;">Total Score: ⭐ ${totalScore}</p>
        <button id="retry-level-btn" style="${this.buttonStyle('#e7a53b')}">Retry Level</button>
        <button id="restart-game-btn" style="${this.buttonStyle('#e5534b')};margin-left:10px;">Restart FarmQuest</button>
      </div>
    `;
    document.getElementById('retry-level-btn')!.addEventListener('click', onRetryLevel);
    document.getElementById('restart-game-btn')!.addEventListener('click', onRestart);
  }

  showRewardPreparing(email: string): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,560px);">
        <h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 14px;color:#bff28a;">Preparing Your Reward...</h1>
        <p style="font-size:21px;color:#e9f6e4;">Sending your coupon to ${this.maskEmail(email)}.</p>
      </div>
    `;
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
        <button id="start-btn" style="${this.buttonStyle('#52a447')}">Start Game</button>
        <div style="margin-top:24px;color:#b8c9b2;font-size:15px;">WASD / Arrow Keys to move. E or Space to interact.</div>
      </div>
    `;
    document.getElementById('start-btn')!.addEventListener('click', onStart);
  }

  showGameOver(currentTask: GameTask | null, onRetry: () => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,560px);">
        <h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 10px;color:#ff766e;">⏱ Time's Up!</h1>
        <p style="font-size:20px;color:#e9f6e4;margin:0 0 18px;">You did not complete the current task.</p>
        ${currentTask ? `
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:16px;margin-bottom:22px;">
            <div style="font-size:12px;font-weight:1000;color:#bff28a;margin-bottom:5px;">CURRENT TASK</div>
            <div style="font-size:28px;font-weight:1000;">${taskIcon(currentTask)} ${titleCase(currentTask.description)}</div>
            <div style="font-size:20px;color:#ffe36d;margin-top:8px;">Progress: ${currentTask.currentAmount} / ${currentTask.targetAmount}</div>
          </div>
        ` : ''}
        <p style="font-size:28px;color:#ffe36d;margin:0 0 28px;">⭐ Final Score: ${this.scoreManager.getScore()}</p>
        <button id="retry-btn" style="${this.buttonStyle('#e5534b')}">Play Again</button>
      </div>
    `;
    document.getElementById('retry-btn')!.addEventListener('click', onRetry);
  }

  showComplete(email: string, emailSent: boolean, completionTime: number, onRetry: () => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = 'flex';
    this.screenEl.innerHTML = `
      <div style="width:min(92vw,600px);">
        <h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 10px;color:#bff28a;">🎉 FarmQuest Complete!</h1>
        <p style="font-size:24px;color:#e9f6e4;margin:0 0 8px;font-weight:900;">You completed the full farm instance.</p>
        <div style="font-size:18px;color:#d8f5c6;margin-bottom:16px;">Completion Time: ${completionTime.toFixed(1)}s</div>
        <p style="font-size:28px;color:#ffe36d;margin:0 0 22px;">⭐ Final Score: ${this.scoreManager.getScore()}</p>
        <div style="display:inline-block;background:rgba(255,227,109,0.12);border:2px solid #ffe36d;border-radius:18px;padding:22px 32px;margin-bottom:24px;">
          <h2 style="font-size:28px;margin:0 0 8px;color:#ffe36d;">🎁 Reward Unlocked</h2>
          <p style="font-size:21px;margin:0 0 14px;">${emailSent ? 'Your coupon has been sent to:' : 'Your reward was created, but the email could not be sent.'}</p>
          <div style="font-size:22px;font-weight:1000;margin-bottom:14px;">${this.maskEmail(email)}</div>
          <div style="font-size:22px;margin-top:16px;">Free Coffee ☕</div>
        </div>
        <br>
        <button id="retry-btn" style="${this.buttonStyle('#52a447')}">Play Again</button>
      </div>
    `;
    document.getElementById('retry-btn')!.addEventListener('click', onRetry);
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
        ${config.buttonText ? `<button id="task-modal-button" style="${this.buttonStyle('#2f8f3a')}">${config.buttonText}</button>` : ''}
      </div>
    `;
  }

  private buttonStyle(color: string): string {
    return `
      padding:15px 36px;font-size:20px;font-weight:1000;background:${color};color:white;
      border:0;border-radius:999px;cursor:pointer;pointer-events:all;box-shadow:0 8px 22px rgba(0,0,0,0.24);
    `;
  }

  private choiceButton(id: string, title: string, body: string): string {
    return `
      <button id="${id}" style="${this.choiceStyle()}">
        <strong style="display:block;font-size:23px;margin-bottom:8px;">${title}</strong>
        <span style="font-size:15px;font-weight:900;color:#315033;">${body}</span>
      </button>
    `;
  }

  private choiceStyle(): string {
    return `
      min-height:132px;padding:18px;border:2px solid rgba(49,80,51,0.25);border-radius:16px;
      background:#fffdf2;color:#193620;cursor:pointer;pointer-events:all;text-align:left;
      box-shadow:0 10px 24px rgba(0,0,0,0.18);font-family:inherit;
    `;
  }

  private inputStyle(): string {
    return `
      width:100%;padding:14px 16px;border-radius:14px;border:2px solid rgba(49,80,51,0.25);
      font-size:18px;font-weight:800;color:#193620;outline:none;background:#fffdf2;
    `;
  }

  private progressDots(currentLevel: number, completedLevels: number[]): string {
    return Array.from({ length: TOTAL_LEVELS }, (_, index) => {
      const level = index + 1;
      if (completedLevels.includes(level)) return '●';
      if (level === currentLevel) return '◉';
      return '○';
    }).join(' - ');
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name.slice(0, 2)}***@${domain}`;
  }
}
