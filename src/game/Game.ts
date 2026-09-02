import * as THREE from 'three';
import { AccountNotFoundError, FarmQuestApi, isValidEmail, PlayerSession } from '../api/FarmQuestApi';
import { GameSocket, LeaderboardEntry, LobbyPlayer } from '../api/GameSocket';
import { CROP_LABEL, CropType } from '../data/CropType';
import { MAP_THEMES, MapId, MapTheme } from '../data/MapTheme';
import { TaskType } from '../data/TaskType';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { CharacterType } from '../player/PlayerModel';
import { HUD } from '../ui/HUD';
import { CharacterSelectScreen } from '../ui/screens/CharacterSelectScreen';
import { CompleteScreen } from '../ui/screens/CompleteScreen';
import { GameOverScreen } from '../ui/screens/GameOverScreen';
import { LeaderboardScreen } from '../ui/screens/LeaderboardScreen';
import { LobbyScreen } from '../ui/screens/LobbyScreen';
import { LoginScreen, LoginMode } from '../ui/screens/LoginScreen';
import { MapSelectScreen } from '../ui/screens/MapSelectScreen';
import { Crop } from '../world/Crop';
import { Interactable } from '../world/Interactable';
import { NPC } from '../world/NPC';
import { Seed } from '../world/Seed';
import { SpawnManager } from '../world/SpawnManager';
import { WaterSource } from '../world/WaterSource';
import { World } from '../world/World';
import { ChallengeGenerator } from './ChallengeGenerator';
import { ChallengeManager } from './ChallengeManager';
import { GameState } from './GameState';
import { GameTask } from './GameTask';
import { ScoreManager } from './ScoreManager';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private hud: HUD;
  private player = new Player('male');
  private playerController = new PlayerController();
  private world = new World(MAP_THEMES.rwanda);
  private npc = new NPC(new THREE.Vector3(-3, 0, 1.6), 'rwanda');
  private scoreManager = new ScoreManager();
  private challengeManager = new ChallengeManager(this.scoreManager);
  private api = new FarmQuestApi();
  private socket = new GameSocket();
  private session: PlayerSession | null = null;
  private spawnManager = new SpawnManager('rwanda');
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
  private characterType: CharacterType = 'male';
  private selectedMapId: MapId = 'rwanda';
  private currentInstanceId = '';
  private gameStartTime = 0;
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private hemisphereLight!: THREE.HemisphereLight;

  constructor(canvas: HTMLCanvasElement, uiOverlay: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.applySceneTheme(MAP_THEMES.rwanda);

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

    this.hemiLight = this.setupLighting();
    this.scene.add(this.world.group, this.npc.mesh, this.player.mesh, this.sessionGroup);
    this.hud = new HUD(uiOverlay, this.scoreManager);
    this.loginScreen = new LoginScreen(uiOverlay);
    this.characterScreen = new CharacterSelectScreen(uiOverlay);
    this.mapScreen = new MapSelectScreen(uiOverlay);
    this.lobbyScreen = new LobbyScreen(uiOverlay);
    this.gameOverScreen = new GameOverScreen(uiOverlay);
    this.completeScreen = new CompleteScreen(uiOverlay);
    this.leaderboardScreen = new LeaderboardScreen(uiOverlay);

    this.bindSocket();
    window.addEventListener('resize', () => this.onResize());
    this.showLoginScreen();
  }

  setCharacterType(type: CharacterType): void {
    this.characterType = type;
  }

  setMapId(mapId: MapId): void {
    this.selectedMapId = mapId;
    this.applyMapTheme(mapId);
  }

  startGame(tasks: GameTask[], instanceId: string, mapId: MapId = this.selectedMapId): void {
    this.currentInstanceId = instanceId;
    this.selectedMapId = mapId;
    this.state = GameState.PLAYING;
    this.scoreManager.reset();
    this.challengeManager.reset();
    this.clearSessionObjects();
    this.seedInventory.clear();
    this.plantQueue = [];
    this.waterFound = false;
    this.applyMapTheme(mapId);
    this.player.mesh.position.set(0, 0, 6);
    this.gameStartTime = performance.now();

    this.spawnManager = new SpawnManager(mapId);
    this.requiredWaterPerCrop = this.getRequiredWaterPerCrop(tasks);
    this.createSessionObjects(tasks);
    this.challengeManager.startWithTasks(
      tasks,
      () => this.onTimeout(),
      () => this.onChallengeUpdate(),
      () => void this.onGameComplete(),
      (message) => this.hud.showFeedback(message),
      (task, isFirstTask) => this.onTaskStarted(task, isFirstTask),
      (completedTask, nextTask) => this.onTaskCompleted(completedTask, nextTask),
    );
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

  private showLoginScreen(): void {
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
      this.hud.showCharacterSelect((type) => {
        this.setCharacterType(type);
        this.hud.showMapSelect((mapId) => {
          this.setMapId(mapId);
          void this.startNewInstance();
        });
      });
    } catch (error) {
      console.error(error);
      this.hud.showRegistration((nextEmail, nextName) => this.registerPlayer(nextEmail, nextName), "We couldn't start your game. Please check your connection and try again.");
    }
  }

  private async startNewInstance(): Promise<void> {
    if (!this.session) {
      this.showLoginScreen();
      return;
    }

    try {
      this.session = await this.api.startNewSession(this.session.playerId, this.session.email, this.session.displayName);
      const instance = await this.api.startInstance(this.session.sessionId, this.selectedMapId);
      this.startGame(instance.tasks, instance.instanceId, instance.mapId);
    } catch (error) {
      console.error(error);
      this.hud.showFeedback("We couldn't create a game instance. Please try again.");
      this.hud.showMapSelect((mapId) => {
        this.setMapId(mapId);
        void this.startNewInstance();
      });
    }
  }

  private applyMapTheme(mapId: MapId): void {
    const theme = MAP_THEMES[mapId];
    this.applySceneTheme(theme);

    this.scene.remove(this.world.group, this.npc.mesh, this.player.mesh);
    this.world = new World(theme);
    this.player = new Player(this.characterType);
    this.npc = new NPC(new THREE.Vector3(-3, 0, 1.6), mapId);
    this.scene.add(this.world.group, this.npc.mesh, this.player.mesh);
  }

  private applySceneTheme(theme: MapTheme): void {
    this.renderer.setClearColor(theme.skyColor);
    this.scene.fog = new THREE.Fog(theme.fogColor, 38, 70);
    if (this.ambientLight) this.ambientLight.intensity = theme.ambientIntensity;
    if (this.sunLight) this.sunLight.intensity = theme.sunIntensity;
    if (this.hemisphereLight) {
      this.hemisphereLight.color.setHex(theme.hemisphereSkyColor);
      this.hemisphereLight.groundColor.setHex(theme.hemisphereGroundColor);
    }
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
    if (this.challengeManager.registerProgress(TaskType.FIND_WATER, undefined, 1, 'Farm fact: water helps roots move nutrients into the plant. +100')) {
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
    this.hud.showGameOver(this.challengeManager.getCurrentTask(), () => {
      this.hud.showCharacterSelect((type) => {
        this.setCharacterType(type);
        this.hud.showMapSelect((mapId) => {
          this.setMapId(mapId);
          void this.startNewInstance();
        });
      });
    });
  }

  private async onGameComplete(): Promise<void> {
    this.state = GameState.COMPLETE;
    this.scoreManager.add(300);
    const completionTime = (performance.now() - this.gameStartTime) / 1000;
    const email = this.session?.email ?? '';
    this.hud.showRewardPreparing(email);

    let emailSent = false;
    try {
      if (this.session) {
        const result = await this.api.completeGame(this.session.sessionId, this.scoreManager.getScore(), completionTime);
        emailSent = result.emailSent;
      }
    } catch (error) {
      console.error(error);
    }

    this.hud.showComplete(email, emailSent, completionTime, () => {
      this.hud.showCharacterSelect((type) => {
        this.setCharacterType(type);
        this.hud.showMapSelect((mapId) => {
          this.setMapId(mapId);
          void this.startNewInstance();
        });
      });
    });
  }

  private onTaskStarted(task: GameTask, isFirstTask: boolean): void {
    if (!isFirstTask) return;
    this.challengeManager.setPaused(true);
    this.hud.showFirstTask(task, () => {
      this.hud.hideTaskModal();
      this.challengeManager.setPaused(false);
      this.onChallengeUpdate();
    }, 1, this.challengeManager.getTaskCount());
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
    this.hud.updateHUD(this.challengeManager.getCurrentTask(), this.challengeManager.getTimeRemaining());
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, MAP_THEMES.rwanda.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, MAP_THEMES.rwanda.sunIntensity);
    this.sunLight.position.set(10, 16, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.left = -24;
    this.sunLight.shadow.camera.right = 24;
    this.sunLight.shadow.camera.top = 24;
    this.sunLight.shadow.camera.bottom = -24;
    this.scene.add(this.sunLight);

    this.hemisphereLight = new THREE.HemisphereLight(MAP_THEMES.rwanda.hemisphereSkyColor, MAP_THEMES.rwanda.hemisphereGroundColor, 0.35);
    this.scene.add(this.hemisphereLight);
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
