import * as THREE from 'three';
import { FarmQuestApi, isValidEmail, PlayerSession } from '../api/FarmQuestApi';
import { CROP_LABEL, CropType } from '../data/CropType';
import { TaskType } from '../data/TaskType';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { HUD } from '../ui/HUD';
import { Crop } from '../world/Crop';
import { Interactable } from '../world/Interactable';
import { NPC } from '../world/NPC';
import { Seed } from '../world/Seed';
import { SpawnManager } from '../world/SpawnManager';
import { WaterSource } from '../world/WaterSource';
import { World } from '../world/World';
import { ChallengeManager } from './ChallengeManager';
import { GameState } from './GameState';
import { GameTask } from './GameTask';
import { LevelManager } from './LevelManager';
import { ScoreManager } from './ScoreManager';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private hud: HUD;
  private player = new Player();
  private playerController = new PlayerController();
  private world = new World();
  private npc = new NPC(new THREE.Vector3(-3, 0, 1.6));
  private scoreManager = new ScoreManager();
  private challengeManager = new ChallengeManager(this.scoreManager);
  private levelManager = new LevelManager();
  private api = new FarmQuestApi();
  private session: PlayerSession | null = null;
  private spawnManager = new SpawnManager();
  private state: GameState = GameState.MENU;
  private sessionGroup = new THREE.Group();
  private seeds: Seed[] = [];
  private crops: Crop[] = [];
  private waterSource: WaterSource | null = null;
  private nearestInteractable: Interactable | null = null;
  private seedInventory = new Map<CropType, number>();
  private plantQueue: CropType[] = [];
  private waterFound = false;
  private requiredWaterPerCrop = 1;

  constructor(canvas: HTMLCanvasElement, uiOverlay: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x8fd3ff);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x8fd3ff, 38, 70);

    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 15;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100,
    );
    this.camera.position.set(12, 16, 18);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.scene.add(this.world.group, this.npc.mesh, this.player.mesh, this.sessionGroup);
    this.hud = new HUD(uiOverlay, this.scoreManager);

    window.addEventListener('resize', () => this.onResize());
    this.hud.showRegistration((email, displayName) => this.registerPlayer(email, displayName));
  }

  private async registerPlayer(email: string, displayName?: string): Promise<void> {
    if (!isValidEmail(email)) {
      this.hud.showRegistration((nextEmail, nextName) => this.registerPlayer(nextEmail, nextName), 'Please enter a valid email address.');
      return;
    }

    this.hud.showRegistration((nextEmail, nextName) => this.registerPlayer(nextEmail, nextName), '', true);
    try {
      this.session = await this.api.registerPlayer(email, displayName);
      this.levelManager.resetToFirstLevel();
      this.scoreManager.reset();
      this.startLevel();
    } catch (error) {
      console.error(error);
      this.hud.showRegistration((nextEmail, nextName) => this.registerPlayer(nextEmail, nextName), "We couldn't start your game. Please check your connection and try again.");
    }
  }

  private async replayAfterCompletion(): Promise<void> {
    if (!this.session) {
      this.hud.showRegistration((email, displayName) => this.registerPlayer(email, displayName));
      return;
    }

    try {
      this.session = await this.api.startNewSession(this.session.playerId, this.session.email, this.session.displayName);
      this.levelManager.resetToFirstLevel();
      this.scoreManager.reset();
      this.startLevel();
    } catch (error) {
      console.error(error);
      this.hud.showRegistration((email, displayName) => this.registerPlayer(email, displayName), "We couldn't start a new session. Please try again.");
    }
  }

  private startLevel(): void {
    this.state = GameState.PLAYING;
    this.challengeManager.reset();
    this.levelManager.beginCurrentLevel(this.scoreManager.getScore());
    this.clearSessionObjects();
    this.seedInventory.clear();
    this.plantQueue = [];
    this.waterFound = false;
    this.player.mesh.position.set(0, 0, 6);
    const level = this.levelManager.getCurrentLevel();

    const tasks = this.challengeManager.start(
      level.id,
      () => this.onTimeout(),
      () => this.onChallengeUpdate(),
      () => this.onAllComplete(),
      (message) => this.hud.showFeedback(message),
      (task, isFirstTask) => this.onTaskStarted(task, isFirstTask),
      (completedTask, nextTask) => this.onTaskCompleted(completedTask, nextTask),
    );
    this.requiredWaterPerCrop = this.getRequiredWaterPerCrop(tasks);
    this.createSessionObjects(tasks);
    this.hud.hideScreen();
  }

  update(): void {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.state === GameState.PLAYING) {
      this.playerController.update(
        delta,
        this.player,
        this.world.bounds,
        (position, radius) => this.world.collision.canMoveTo(position, radius),
      );
      this.challengeManager.update(delta);
      this.hud.update(delta);

      for (const seed of this.seeds) seed.update(time);

      this.nearestInteractable = this.findNearestInteractable();
      if (this.nearestInteractable) this.hud.showPrompt(this.getPrompt(this.nearestInteractable));
      else this.hud.hidePrompt();

      if (this.playerController.consumeInteract()) this.handleInteraction();
      this.updateCamera();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private createSessionObjects(tasks: GameTask[]): void {
    const seedSpawns = this.spawnManager.generateSeeds(tasks);
    const totalSeeds = seedSpawns.length;

    this.seeds = seedSpawns.map((spawn) => {
      const seed = new Seed(spawn.position, spawn.cropType);
      seed.setOnInteract(() => this.collectSeed(seed));
      this.sessionGroup.add(seed.mesh);
      return seed;
    });

    this.crops = this.spawnManager.generatePlots(totalSeeds).map((position) => {
      const crop = new Crop(position);
      crop.setOnInteract(() => this.useCrop(crop));
      this.sessionGroup.add(crop.mesh);
      return crop;
    });

    const water = this.spawnManager.chooseWaterSource();
    this.waterSource = new WaterSource(water.position, water.name);
    this.waterSource.setOnInteract(() => this.useWaterSource());
    this.sessionGroup.add(this.waterSource.mesh);
    this.world.collision.addDynamicBox(`water-${water.name}`, new THREE.Vector3(water.position.x, 0.75, water.position.z), new THREE.Vector3(1.35, 1.5, 1.35));
  }

  private collectSeed(seed: Seed): void {
    const ok = this.challengeManager.registerProgress(
      TaskType.COLLECT_SEED,
      seed.cropType,
      1,
      `${CROP_LABEL[seed.cropType]} ${seed.cropType === CropType.COFFEE ? 'bean' : 'seed'} found +${seed.cropType === CropType.COFFEE ? 75 : 50}`,
    );
    if (!ok) {
      seed.reset();
      this.hud.showFeedback(`This ${CROP_LABEL[seed.cropType]} item is for a later task`);
      return;
    }

    this.addSeed(seed.cropType);
    this.scoreManager.add(seed.cropType === CropType.COFFEE ? 75 : 50);
  }

  private useWaterSource(): void {
    if (this.challengeManager.registerProgress(TaskType.FIND_WATER, undefined, 1, `Farm fact: water helps roots move nutrients into the plant. +100`)) {
      this.waterFound = true;
      this.scoreManager.add(100);
      return;
    }
    this.hud.showFeedback('Water source found. Finish the current task first.');
  }

  private useCrop(crop: Crop): void {
    const task = this.challengeManager.getCurrentTask();
    if (!task) return;

    if ((task.type === TaskType.PLANT_SEED || task.type === TaskType.PLANT_MULTIPLE_SEEDS) && crop.isReadyToPlant()) {
      const cropType = this.nextSeedToPlant();
      if (!cropType) {
        this.hud.showFeedback('Collect seeds before planting');
        return;
      }
      crop.plantCrop(cropType, this.requiredWaterPerCrop);
      this.consumeSeed(cropType);
      if (this.challengeManager.registerProgress(TaskType.PLANT_SEED, cropType, 1, `${CROP_LABEL[cropType]} planted +50`)) {
        this.scoreManager.add(50);
      }
      return;
    }

    if ((task.type === TaskType.WATER_CROP || task.type === TaskType.WATER_CROP_MULTIPLE) && crop.isReadyToWater()) {
      if (!this.waterFound) {
        this.hud.showFeedback('Find water before watering crops');
        return;
      }
      const cropType = crop.cropType ?? undefined;
      crop.water();
      if (this.challengeManager.registerProgress(TaskType.WATER_CROP, cropType, 1, `${cropType ? CROP_LABEL[cropType] : 'Crop'} watered +50`)) {
        this.scoreManager.add(50);
      }
      return;
    }

    if ((task.type === TaskType.HARVEST_CROP || task.type === TaskType.HARVEST_MULTIPLE) && crop.isReadyToHarvest()) {
      const cropType = crop.cropType ?? undefined;
      crop.harvest();
      if (this.challengeManager.registerProgress(TaskType.HARVEST_CROP, cropType, 1, `${cropType ? CROP_LABEL[cropType] : 'Crop'} harvested +150`)) {
        this.scoreManager.add(150);
      }
    }
  }

  private handleInteraction(): void {
    if (this.state !== GameState.PLAYING || !this.nearestInteractable) return;
    this.nearestInteractable.interact();
  }

  private findNearestInteractable(): Interactable | null {
    const task = this.challengeManager.getCurrentTask();
    if (!task) return null;

    const candidates: Interactable[] = [
      ...this.seeds.filter((seed) => this.isSeedRelevant(seed, task)),
      ...this.crops.filter((crop) => this.isCropRelevant(crop, task)),
      ...(this.waterSource && task.type === TaskType.FIND_WATER ? [this.waterSource] : []),
    ];

    const playerPos = this.player.getPosition();
    let nearest: Interactable | null = null;
    let nearestDist = Infinity;
    for (const obj of candidates) {
      if (!obj.isAvailable()) continue;
      const dist = playerPos.distanceTo(obj.mesh.position);
      if (dist < this.player.interactRange && dist < nearestDist) {
        nearest = obj;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  private isSeedRelevant(seed: Seed, task: GameTask): boolean {
    return (
      (task.type === TaskType.COLLECT_SEED || task.type === TaskType.COLLECT_MULTIPLE_SEEDS) &&
      (!task.cropType || task.cropType === seed.cropType)
    );
  }

  private isCropRelevant(crop: Crop, task: GameTask): boolean {
    if (task.type === TaskType.PLANT_SEED || task.type === TaskType.PLANT_MULTIPLE_SEEDS) return crop.isReadyToPlant() && this.plantQueue.length > 0;
    if (task.type === TaskType.WATER_CROP || task.type === TaskType.WATER_CROP_MULTIPLE) return crop.isReadyToWater();
    if (task.type === TaskType.HARVEST_CROP || task.type === TaskType.HARVEST_MULTIPLE) return crop.isReadyToHarvest();
    return false;
  }

  private getPrompt(obj: Interactable): string {
    if (obj instanceof Crop) {
      const task = this.challengeManager.getCurrentTask();
      if (task?.type === TaskType.PLANT_SEED || task?.type === TaskType.PLANT_MULTIPLE_SEEDS) {
        const cropType = this.plantQueue[0];
        return cropType ? `Plant ${CROP_LABEL[cropType]}` : 'Plant Seed';
      }
    }
    return obj.label;
  }

  private addSeed(cropType: CropType): void {
    this.seedInventory.set(cropType, (this.seedInventory.get(cropType) ?? 0) + 1);
    this.plantQueue.push(cropType);
  }

  private consumeSeed(cropType: CropType): void {
    this.seedInventory.set(cropType, Math.max(0, (this.seedInventory.get(cropType) ?? 0) - 1));
    const index = this.plantQueue.indexOf(cropType);
    if (index >= 0) this.plantQueue.splice(index, 1);
  }

  private nextSeedToPlant(): CropType | null {
    return this.plantQueue[0] ?? null;
  }

  private getRequiredWaterPerCrop(tasks: GameTask[]): number {
    const plantTask = tasks.find((task) => task.type === TaskType.PLANT_SEED || task.type === TaskType.PLANT_MULTIPLE_SEEDS);
    const waterTask = tasks.find((task) => task.type === TaskType.WATER_CROP || task.type === TaskType.WATER_CROP_MULTIPLE);
    if (!plantTask || !waterTask) return 1;
    return Math.max(1, Math.round(waterTask.targetAmount / plantTask.targetAmount));
  }

  private clearSessionObjects(): void {
    while (this.sessionGroup.children.length > 0) {
      this.sessionGroup.remove(this.sessionGroup.children[0]);
    }
    this.world.collision.clearDynamic();
    this.seeds = [];
    this.crops = [];
    this.waterSource = null;
    this.nearestInteractable = null;
  }

  private onTimeout(): void {
    this.state = GameState.GAME_OVER;
    this.hud.showLevelFailed(
      this.levelManager.getCurrentLevel(),
      this.challengeManager.getCompletedTaskCount(),
      this.challengeManager.getTaskCount(),
      this.scoreManager.getScore(),
      () => this.retryLevel(),
      () => {
        void this.restartFarmQuest();
      },
    );
  }

  private async onAllComplete(): Promise<void> {
    const level = this.levelManager.getCurrentLevel();
    const levelScore = this.levelManager.getLevelScore(this.scoreManager.getScore());
    try {
      if (this.session) await this.api.completeLevel(this.session.sessionId, level.id, levelScore);
    } catch (error) {
      console.error(error);
      this.hud.showFeedback('Level saved locally. Backend sync can be retried later.');
    }

    this.levelManager.completeCurrentLevel();
    const completedLevels = this.levelManager.getCompletedLevels();
    if (this.session) {
      this.session.completedLevels = completedLevels;
      this.session.totalScore = this.scoreManager.getScore();
    }

    if (this.levelManager.hasNextLevel()) {
      const nextLevel = this.levelManager.getAllLevels().find((item) => item.id === level.id + 1) ?? null;
      this.hud.showLevelComplete(level, nextLevel, levelScore, this.scoreManager.getScore(), () => {
        this.levelManager.advanceToNextLevel();
        if (this.session) this.session.currentLevel = this.levelManager.getCurrentLevel().id;
        this.startLevel();
      });
      return;
    }

    await this.completeGame();
  }

  private onTaskStarted(task: GameTask, isFirstTask: boolean): void {
    if (!isFirstTask) return;
    this.challengeManager.setPaused(true);
    this.hud.showLevelIntro(this.levelManager.getCurrentLevel(), task, () => {
      this.hud.hideTaskModal();
      this.challengeManager.setPaused(false);
      this.onChallengeUpdate();
    });
  }

  private onTaskCompleted(completedTask: GameTask, nextTask: GameTask | null): void {
    if (!nextTask) return;
    this.challengeManager.setPaused(true);
    this.hud.showTaskTransition(completedTask, nextTask, () => {
      this.challengeManager.setPaused(false);
      this.onChallengeUpdate();
    });
  }

  private onChallengeUpdate(): void {
    this.hud.updateHUD(
      this.challengeManager.getCurrentTask(),
      this.challengeManager.getTimeRemaining(),
      this.levelManager.getCurrentLevel(),
      this.levelManager.getCompletedLevels(),
    );
  }

  private retryLevel(): void {
    const levelStartScore = this.scoreManager.getScore() - this.levelManager.getLevelScore(this.scoreManager.getScore());
    this.scoreManager.setScore(levelStartScore);
    this.startLevel();
  }

  private async restartFarmQuest(): Promise<void> {
    this.scoreManager.reset();
    this.levelManager.resetToFirstLevel();
    if (this.session) {
      try {
        this.session = await this.api.startNewSession(this.session.playerId, this.session.email, this.session.displayName);
      } catch (error) {
        console.error(error);
        this.session.currentLevel = 1;
        this.session.completedLevels = [];
        this.session.totalScore = 0;
      }
    }
    this.startLevel();
  }

  private async completeGame(): Promise<void> {
    this.state = GameState.COMPLETE;
    this.scoreManager.add(300);
    const completedLevels = this.levelManager.getCompletedLevels();
    const email = this.session?.email ?? '';
    this.hud.showRewardPreparing(email);

    let emailSent = false;
    try {
      if (this.session) {
        const result = await this.api.completeGame(this.session.sessionId, this.scoreManager.getScore());
        emailSent = result.emailSent;
      }
    } catch (error) {
      console.error(error);
    }

    this.hud.showComplete(email, emailSent, completedLevels, () => {
      void this.replayAfterCompletion();
    });
  }

  private setupLighting(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.62));

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(10, 16, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0x8fd3ff, 0x7ec850, 0.35));
  }

  private updateCamera(): void {
    const playerPos = this.player.getPosition();
    const target = new THREE.Vector3(playerPos.x + 12, 16, playerPos.z + 18);
    this.camera.position.lerp(target, 0.06);
    this.camera.lookAt(playerPos.x, 0, playerPos.z);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);

    const aspect = w / h;
    const frustumSize = 15;
    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }
}
