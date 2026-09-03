import { CropType } from "../data/CropType";
import { TaskType } from "../data/TaskType";
import { GameTask } from "../game/GameTask";
import { ScoreManager } from "../game/ScoreManager";

const taskIcon = (task: GameTask | null) => {
  if (!task) return "🌱";
  if (
    task.type === TaskType.FIND_WATER ||
    task.type === TaskType.WATER_CROP ||
    task.type === TaskType.WATER_CROP_MULTIPLE
  )
    return "💧";
  if (
    task.type === TaskType.PLANT_SEED ||
    task.type === TaskType.PLANT_MULTIPLE_SEEDS
  )
    return "🌱";
  if (
    task.type === TaskType.HARVEST_CROP ||
    task.type === TaskType.HARVEST_MULTIPLE
  )
    return "🌾";
  if (task.cropType === CropType.COFFEE) return "☕";
  if (task.cropType === CropType.CASSAVA) return "🌿";
  return "🌽";
};

const titleCase = (text: string) =>
  text.replace(/\b\w/g, (l) => l.toUpperCase());

export class HUD {
  private hudEl: HTMLElement;
  private promptEl: HTMLElement;
  private screenEl: HTMLElement;
  private feedbackEl: HTMLElement;
  private taskModalEl: HTMLElement;
  private feedbackTimer = 0;
  private transitionTimer: number | null = null;

  constructor(
    private overlay: HTMLElement,
    private scoreManager: ScoreManager,
  ) {
    this.overlay.innerHTML = "";
    this.overlay.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:10;font-family:Segoe UI,Tahoma,sans-serif;";
    this.hudEl = this.mkDiv(
      "position:absolute;top:16px;left:50%;transform:translateX(-50%);width:min(94vw,620px);background:linear-gradient(135deg,rgba(20,43,27,0.94),rgba(32,65,42,0.9));color:white;border:2px solid rgba(255,232,126,0.42);border-radius:18px;padding:15px 18px;box-shadow:0 18px 42px rgba(0,0,0,0.26);display:none;pointer-events:none;overflow:hidden;",
    );
    this.promptEl = this.mkDiv(
      "position:absolute;bottom:72px;left:50%;transform:translateX(-50%);background:rgba(18,24,20,0.9);color:#ffe36d;padding:12px 22px;border-radius:999px;font-size:18px;font-weight:900;border:2px solid #ffe36d;display:none;pointer-events:none;box-shadow:0 12px 26px rgba(0,0,0,0.22);",
    );
    this.feedbackEl = this.mkDiv(
      "position:absolute;top:165px;left:50%;transform:translateX(-50%);width:min(90vw,420px);background:#fffdf2;color:#173320;border-left:8px solid #52a447;border-radius:14px;padding:13px 16px;font-size:18px;font-weight:900;display:none;box-shadow:0 14px 34px rgba(0,0,0,0.2);pointer-events:none;text-align:center;",
    );
    this.taskModalEl = this.mkDiv(
      "position:absolute;inset:0;display:none;justify-content:center;align-items:center;background:radial-gradient(circle at 50% 42%,rgba(63,117,67,0.28),rgba(8,13,10,0.58));pointer-events:all;color:white;text-align:center;padding:20px;z-index:20;",
    );
    this.screenEl = this.mkDiv(
      "position:absolute;inset:0;display:none;justify-content:center;align-items:center;background:rgba(12,19,15,0.86);pointer-events:all;color:white;text-align:center;padding:24px;z-index:20;",
    );
  }

  private mkDiv(css: string): HTMLElement {
    const d = document.createElement("div");
    d.style.cssText = css;
    this.overlay.appendChild(d);
    return d;
  }

  updateHUD(
    task: GameTask | null,
    timeRemaining: number,
    currentTaskIndex?: number,
    totalTasks?: number,
  ): void {
    if (!task) return;
    this.hudEl.style.display = "block";
    const ts = `${String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:${String(Math.floor(timeRemaining) % 60).padStart(2, "0")}`;
    const low = timeRemaining <= 8;
    const prog = Math.round((task.currentAmount / task.targetAmount) * 100);
    const info =
      currentTaskIndex != null && totalTasks != null
        ? `TASK ${currentTaskIndex + 1} / ${totalTasks}`
        : "";
    this.hudEl.innerHTML = `<div style="display:flex;gap:14px;align-items:center;"><div style="font-size:42px;line-height:1;background:rgba(255,255,255,0.13);border-radius:14px;padding:9px 12px;">${taskIcon(task)}</div><div style="flex:1;min-width:0;text-align:left;"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:3px;"><div style="font-size:12px;font-weight:1000;letter-spacing:0;color:#bff28a;">CURRENT TASK</div>${info ? `<div style="font-size:13px;font-weight:1000;color:#ffe36d;">${info}</div>` : ""}</div><div style="font-size:clamp(22px,4vw,32px);line-height:1.08;font-weight:1000;margin-bottom:11px;">${titleCase(task.description)}</div><div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;"><div style="height:13px;background:rgba(255,255,255,0.18);border-radius:999px;overflow:hidden;"><div style="height:100%;width:${prog}%;background:linear-gradient(90deg,#ffe36d,#8ee05d);border-radius:999px;"></div></div><div style="font-size:20px;font-weight:1000;color:#ffe36d;">${task.currentAmount} / ${task.targetAmount}</div></div><div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:9px;font-size:17px;font-weight:900;"><span style="color:${low ? "#ff766e" : "#bff28a"};">⏱ ${ts}</span><span style="color:#ffe36d;">⭐ Score ${this.scoreManager.getScore()}</span></div></div></div>`;
  }

  showRegistration(
    onRegister: (email: string, displayName?: string) => void,
    errorMessage = "",
    loading = false,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    this.screenEl.innerHTML = `<form id="reg-form" style="width:min(92vw,560px);background:linear-gradient(145deg,#fdf8df,#ecd17a);color:#193620;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.3);"><h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 8px;font-weight:1000;">FarmQuest</h1><p style="font-size:19px;margin:0 0 20px;font-weight:800;color:#315033;">Enter your email to start.</p><label style="display:block;text-align:left;font-weight:1000;margin:0 0 8px;">Email Address</label><input id="email-input" type="email" autocomplete="email" placeholder="player@example.com" style="${this.inp()}" /><label style="display:block;text-align:left;font-weight:1000;margin:14px 0 8px;">Display Name <span style="font-weight:700;color:#5d744d;">optional</span></label><input id="name-input" type="text" maxlength="40" placeholder="Player" style="${this.inp()}" />${errorMessage ? `<div style="margin-top:14px;color:#b52828;font-weight:900;">${errorMessage}</div>` : ""}<button type="submit" style="${this.btn("#2f8f3a")};margin-top:20px;" ${loading ? "disabled" : ""}>${loading ? "Starting..." : "Start FarmQuest"}</button></form>`;
    document.getElementById("reg-form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      onRegister(
        (document.getElementById("email-input") as HTMLInputElement).value,
        (document.getElementById("name-input") as HTMLInputElement).value,
      );
    });
    for (const id of ["email-input", "name-input"]) {
      document
        .getElementById(id)
        ?.addEventListener("keydown", (e) => e.stopPropagation());
      document
        .getElementById(id)
        ?.addEventListener("keyup", (e) => e.stopPropagation());
    }
  }

  showLogin(
    onLogin: (email: string) => void,
    onRegister: (email: string, displayName: string) => void,
    errorMessage = "",
    loading = false,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    this.screenEl.innerHTML = `<div style="width:min(92vw,560px);background:linear-gradient(145deg,#fdf8df,#ecd17a);color:#193620;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.3);"><h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 8px;font-weight:1000;">FarmQuest</h1><p style="font-size:19px;margin:0 0 20px;font-weight:800;color:#315033;">Login or create an account to play.</p><div id="login-mode"><label style="display:block;text-align:left;font-weight:1000;margin:0 0 8px;">Email Address</label><input id="login-email" type="email" autocomplete="email" placeholder="player@example.com" style="${this.inp()}" />${errorMessage ? `<div style="margin-top:14px;color:#b52828;font-weight:900;">${errorMessage}</div>` : ""}<button id="login-btn" style="${this.btn("#2f8f3a")};margin-top:20px;" ${loading ? "disabled" : ""}>${loading ? "Logging in..." : "Login"}</button><div style="margin-top:16px;font-size:15px;color:#5d744d;">Don't have an account? <a href="#" id="show-reg" style="color:#2f8f3a;font-weight:900;">Register</a></div></div><div id="reg-mode" style="display:none;"><label style="display:block;text-align:left;font-weight:1000;margin:0 0 8px;">Email Address</label><input id="reg-email" type="email" autocomplete="email" placeholder="player@example.com" style="${this.inp()}" /><label style="display:block;text-align:left;font-weight:1000;margin:14px 0 8px;">Display Name</label><input id="reg-name" type="text" maxlength="40" placeholder="Player" style="${this.inp()}" /><button id="reg-btn" style="${this.btn("#2f8f3a")};margin-top:20px;" ${loading ? "disabled" : ""}>${loading ? "Creating..." : "Create Account"}</button><div style="margin-top:16px;font-size:15px;color:#5d744d;">Already have an account? <a href="#" id="show-login" style="color:#2f8f3a;font-weight:900;">Login</a></div></div></div>`;
    document.getElementById("show-reg")?.addEventListener("click", (e) => {
      e.preventDefault();
      (document.getElementById("login-mode") as HTMLElement).style.display =
        "none";
      (document.getElementById("reg-mode") as HTMLElement).style.display =
        "block";
    });
    document.getElementById("show-login")?.addEventListener("click", (e) => {
      e.preventDefault();
      (document.getElementById("reg-mode") as HTMLElement).style.display =
        "none";
      (document.getElementById("login-mode") as HTMLElement).style.display =
        "block";
    });
    document.getElementById("login-btn")?.addEventListener("click", () => {
      const e = (document.getElementById("login-email") as HTMLInputElement)
        .value;
      if (e) onLogin(e);
    });
    document.getElementById("reg-btn")?.addEventListener("click", () => {
      const e = (document.getElementById("reg-email") as HTMLInputElement)
        .value;
      const n = (document.getElementById("reg-name") as HTMLInputElement).value;
      if (e) onRegister(e, n);
    });
  }

  showCharacterSelect(
    options: { type: string; label: string; icon: string }[],
    onSelect: (type: string) => void,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    const cards = options
      .map(
        (o) =>
          `<div class="cc" data-t="${o.type}" style="cursor:pointer;padding:20px;border-radius:16px;border:3px solid transparent;background:rgba(255,255,255,0.12);transition:all 0.2s;min-width:120px;text-align:center;"><div style="font-size:48px;margin-bottom:8px;">${o.icon}</div><div style="font-size:18px;font-weight:900;">${o.label}</div></div>`,
      )
      .join("");
    this.screenEl.innerHTML = `<div style="width:min(92vw,600px);"><h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 8px;">Choose Your Character</h1><p style="font-size:18px;color:#d8f5c6;margin:0 0 24px;">Select who you'll play as</p><div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">${cards}</div></div>`;
    let sel = "";
    const els = this.screenEl.querySelectorAll(".cc");
    els.forEach((c) =>
      c.addEventListener("click", () => {
        els.forEach((x) => {
          (x as HTMLElement).style.borderColor = "transparent";
          (x as HTMLElement).style.background = "rgba(255,255,255,0.12)";
        });
        (c as HTMLElement).style.borderColor = "#ffe36d";
        (c as HTMLElement).style.background = "rgba(255,227,109,0.15)";
        sel = (c as HTMLElement).dataset.t ?? "";
      }),
    );
    const btn = document.createElement("button");
    btn.textContent = "Select Character";
    btn.style.cssText = this.btn("#52a447");
    btn.addEventListener("click", () => {
      if (sel) onSelect(sel);
    });
    this.screenEl.querySelector("div")?.appendChild(btn);
  }

  showMapSelect(
    options: { id: string; name: string; description: string; icon: string }[],
    onSelect: (id: string) => void,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    const cards = options
      .map(
        (o) =>
          `<div class="mc" data-id="${o.id}" style="cursor:pointer;padding:20px;border-radius:16px;border:3px solid transparent;background:rgba(255,255,255,0.12);transition:all 0.2s;min-width:140px;text-align:center;"><div style="font-size:48px;margin-bottom:8px;">${o.icon}</div><div style="font-size:20px;font-weight:900;">${o.name}</div><div style="font-size:14px;color:#d8f5c6;margin-top:4px;">${o.description}</div></div>`,
      )
      .join("");
    this.screenEl.innerHTML = `<div style="width:min(92vw,600px);"><h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 8px;">Select Your Map</h1><p style="font-size:18px;color:#d8f5c6;margin:0 0 24px;">Choose where to farm</p><div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">${cards}</div></div>`;
    let sel = "";
    const els = this.screenEl.querySelectorAll(".mc");
    els.forEach((c) =>
      c.addEventListener("click", () => {
        els.forEach((x) => {
          (x as HTMLElement).style.borderColor = "transparent";
          (x as HTMLElement).style.background = "rgba(255,255,255,0.12)";
        });
        (c as HTMLElement).style.borderColor = "#ffe36d";
        (c as HTMLElement).style.background = "rgba(255,227,109,0.15)";
        sel = (c as HTMLElement).dataset.id ?? "";
      }),
    );
    const btn = document.createElement("button");
    btn.textContent = "Select Map";
    btn.style.cssText = this.btn("#52a447");
    btn.addEventListener("click", () => {
      if (sel) onSelect(sel);
    });
    this.screenEl.querySelector("div")?.appendChild(btn);
  }

  showLobby(
    playerCount: number,
    displayName: string,
    characterType: string,
    mapName: string,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    const ci: Record<string, string> = {
      male: "👨",
      female: "👩",
      robot: "🤖",
    };
    const mi: Record<string, string> = {
      rwanda: "🌧️",
      sudan: "🏜️",
      seychelles: "🌊",
    };
    this.screenEl.innerHTML = `<div style="width:min(92vw,500px);"><h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 10px;">⏳ Waiting to Start</h1><p style="font-size:20px;color:#d8f5c6;margin:0 0 20px;">Connected Players: <strong>${playerCount}</strong></p><div style="background:rgba(255,255,255,0.1);border-radius:14px;padding:16px;margin-bottom:20px;"><div style="font-size:18px;margin-bottom:6px;">Your Character: ${ci[characterType] ?? "👤"} ${characterType}</div><div style="font-size:18px;">Your Map: ${mi[mapName] ?? "🌍"} ${mapName}</div></div><p style="font-size:16px;color:#b8c9b2;">The game will start when the admin begins the session.</p></div>`;
  }

  showLeaderboard(
    entries: {
      rank: number;
      displayName: string;
      score: number;
      completionTime: number;
    }[],
    yourRank: number,
    yourScore: number,
    isTopTen: boolean,
    onPlayAgain: () => void,
  ): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    const rows = entries
      .slice(0, 10)
      .map((e) => {
        const m =
          e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : "";
        const h =
          e.rank === yourRank ? "background:rgba(255,227,109,0.15);" : "";
        const t = `${Math.floor(e.completionTime / 60)}:${String(Math.floor(e.completionTime % 60)).padStart(2, "0")}`;
        return `<div style="${h}padding:8px 12px;border-radius:8px;margin-bottom:4px;display:flex;justify-content:space-between;font-size:18px;"><span>${m} ${e.rank}. ${e.displayName}</span><span style="color:#ffe36d;">${e.score} pts (${t})</span></div>`;
      })
      .join("");
    this.screenEl.innerHTML = `<div style="width:min(92vw,560px);"><h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 10px;">🏆 Leaderboard</h1><div style="background:rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:16px;max-height:320px;overflow-y:auto;">${rows}</div><div style="font-size:22px;margin-bottom:6px;">Your Rank: <strong>#${yourRank}</strong></div><div style="font-size:22px;color:#ffe36d;margin-bottom:16px;">Your Score: ${yourScore} pts</div>${isTopTen ? '<div style="background:rgba(255,227,109,0.12);border:2px solid #ffe36d;border-radius:16px;padding:18px;margin-bottom:20px;"><div style="font-size:24px;font-weight:900;color:#ffe36d;">🎉 Top 10 — Reward Unlocked!</div><div style="font-size:18px;margin-top:8px;">Check your email for your QR code coupon.</div></div>' : '<p style="font-size:18px;color:#d8f5c6;margin-bottom:16px;">Top 10 players receive rewards!</p>'}<button id="play-again" style="${this.btn("#52a447")}">Play Again</button></div>`;
    document
      .getElementById("play-again")
      ?.addEventListener("click", onPlayAgain);
  }

  showFirstTask(task: GameTask, onStart: () => void): void {
    this.hideHUD();
    this.taskModalEl.style.display = "flex";
    this.taskModalEl.innerHTML = this.card({
      eyebrow: "Welcome to FarmQuest",
      kicker: "Your First Task",
      icon: taskIcon(task),
      title: titleCase(task.description),
      body: `Complete the farming challenges before time runs out.<br>Progress ${task.currentAmount} / ${task.targetAmount}`,
      buttonText: "Start Game",
    });
    document
      .getElementById("task-modal-button")!
      .addEventListener("click", onStart);
  }

  showTaskTransition(
    completedTask: GameTask,
    nextTask: GameTask | null,
    onDone: () => void,
  ): void {
    if (this.transitionTimer) window.clearTimeout(this.transitionTimer);
    this.hideHUD();
    this.taskModalEl.style.display = "flex";
    this.taskModalEl.innerHTML = this.card({
      eyebrow: "Task Complete!",
      icon: "✓",
      title: titleCase(completedTask.description),
      body: `Progress ${completedTask.targetAmount} / ${completedTask.targetAmount}. +${completedTask.scoreReward} points`,
    });
    this.transitionTimer = window.setTimeout(() => {
      if (!nextTask) {
        onDone();
        return;
      }
      this.taskModalEl.innerHTML = this.card({
        eyebrow: "Next Task",
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

  showGameOver(currentTask: GameTask | null, onRetry: () => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    this.screenEl.innerHTML = `<div style="width:min(92vw,560px);"><h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 10px;color:#ff766e;">⏱ Time's Up!</h1><p style="font-size:20px;color:#e9f6e4;margin:0 0 18px;">You did not complete the current task.</p>${currentTask ? `<div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:16px;margin-bottom:22px;"><div style="font-size:12px;font-weight:1000;color:#bff28a;margin-bottom:5px;">CURRENT TASK</div><div style="font-size:28px;font-weight:1000;">${taskIcon(currentTask)} ${titleCase(currentTask.description)}</div><div style="font-size:20px;color:#ffe36d;margin-top:8px;">Progress: ${currentTask.currentAmount} / ${currentTask.targetAmount}</div></div>` : ""}<p style="font-size:28px;color:#ffe36d;margin:0 0 28px;">⭐ Final Score: ${this.scoreManager.getScore()}</p><button id="retry-btn" style="${this.btn("#e5534b")}">Play Again</button></div>`;
    document.getElementById("retry-btn")?.addEventListener("click", onRetry);
  }

  showComplete(email: string, emailSent: boolean, onRetry: () => void): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    this.screenEl.innerHTML = `<div style="width:min(92vw,600px);"><h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 10px;color:#bff28a;">🎉 FarmQuest Complete!</h1><p style="font-size:24px;color:#e9f6e4;margin:0 0 8px;font-weight:900;">All tasks completed!</p><p style="font-size:28px;color:#ffe36d;margin:0 0 22px;">⭐ Final Score: ${this.scoreManager.getScore()}</p><div style="display:inline-block;background:rgba(255,227,109,0.12);border:2px solid #ffe36d;border-radius:18px;padding:22px 32px;margin-bottom:24px;"><h2 style="font-size:28px;margin:0 0 8px;color:#ffe36d;">🎁 Reward Unlocked</h2><p style="font-size:21px;margin:0 0 14px;">${emailSent ? "Your coupon has been sent to:" : "Your reward was created, but the email could not be sent."}</p><div style="font-size:22px;font-weight:1000;margin-bottom:14px;">${this.mask(email)}</div><div style="font-size:22px;margin-top:16px;">Free Coffee ☕</div></div><br><button id="retry-btn" style="${this.btn("#52a447")}">Play Again</button></div>`;
    document.getElementById("retry-btn")?.addEventListener("click", onRetry);
  }

  showRewardPreparing(email: string): void {
    this.hideHUD();
    this.hideTaskModal();
    this.screenEl.style.display = "flex";
    this.screenEl.innerHTML = `<div style="width:min(92vw,560px);"><h1 style="font-size:clamp(34px,7vw,52px);margin:0 0 14px;color:#bff28a;">Preparing Your Reward...</h1><p style="font-size:21px;color:#e9f6e4;">Sending your coupon to ${this.mask(email)}.</p></div>`;
  }

  showPrompt(text: string): void {
    this.promptEl.style.display = "block";
    this.promptEl.textContent = `[E] ${text}`;
  }
  hidePrompt(): void {
    this.promptEl.style.display = "none";
  }
  showFeedback(message: string): void {
    this.feedbackEl.textContent = message;
    this.feedbackEl.style.display = "block";
    this.feedbackTimer = 1.8;
  }
  hideScreen(): void {
    this.screenEl.style.display = "none";
  }
  hideHUD(): void {
    this.hudEl.style.display = "none";
    this.promptEl.style.display = "none";
  }
  hideTaskModal(): void {
    if (this.transitionTimer) window.clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
    this.taskModalEl.style.display = "none";
  }

  update(delta: number): void {
    if (this.feedbackTimer <= 0) return;
    this.feedbackTimer -= delta;
    if (this.feedbackTimer <= 0) this.feedbackEl.style.display = "none";
  }

  private card(c: {
    eyebrow: string;
    icon: string;
    title: string;
    body: string;
    kicker?: string;
    buttonText?: string;
  }): string {
    return `<div style="width:min(90vw,540px);background:linear-gradient(145deg,#fdf8df,#f4df9b 58%,#e2bb56);color:#193620;border:3px solid #fff6c8;border-radius:24px;padding:26px 28px;box-shadow:0 24px 60px rgba(0,0,0,0.34);position:relative;overflow:hidden;"><div style="position:absolute;inset:auto -34px -48px auto;width:150px;height:150px;border-radius:50%;background:rgba(82,164,71,0.22);"></div><div style="font-size:13px;font-weight:1000;color:#2f7a35;text-transform:uppercase;">${c.eyebrow}</div>${c.kicker ? `<div style="font-size:18px;font-weight:1000;margin-top:12px;color:#835c16;">${c.kicker}</div>` : ""}<div style="font-size:56px;line-height:1;margin:12px 0 8px;">${c.icon}</div><h1 style="font-size:clamp(30px,7vw,46px);line-height:1.04;margin:0 0 14px;font-weight:1000;">${c.title}</h1><p style="font-size:19px;line-height:1.35;margin:0 0 ${c.buttonText ? "22px" : "0"};font-weight:800;color:#315033;">${c.body}</p>${c.buttonText ? `<button id="task-modal-button" style="${this.btn("#2f8f3a")}">${c.buttonText}</button>` : ""}</div>`;
  }

  private btn(color: string): string {
    return `padding:15px 36px;font-size:20px;font-weight:1000;background:${color};color:white;border:0;border-radius:999px;cursor:pointer;pointer-events:all;box-shadow:0 8px 22px rgba(0,0,0,0.24);`;
  }
  private inp(): string {
    return `width:100%;padding:14px 16px;border-radius:14px;border:2px solid rgba(49,80,51,0.25);font-size:18px;font-weight:800;color:#193620;outline:none;background:#fffdf2;`;
  }
  private mask(email: string): string {
    const [n, d] = email.split("@");
    return n && d ? `${n.slice(0, 2)}***@${d}` : email;
  }
}
