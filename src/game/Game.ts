import * as THREE from 'three';
import { AccountNotFoundError, FarmQuestApi, isValidEmail, PlayerSession } from '../api/FarmQuestApi';
import { GameSocket, LeaderboardEntry, LobbyPlayer } from '../api/GameSocket';
import { CROP_LABEL, CropType } from '../data/CropType';
import { CharacterType, getCharacterOption } from '../data/CharacterOptions';
import { getMapOption, MapId } from '../data/MapOptions';
import { TaskType } from '../data/TaskType';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
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
  private player = new Player();
  private playerController = new PlayerController();
  private world = new World();
  private npc = new NPC(new THREE.Vector3(-3, 0, 1.6));
  private scoreManager = new ScoreManager();
  private challengeManager = new ChallengeManager(this.scoreManager);
  private api = new FarmQuestApi();
  private socket = new GameSocket();
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
  private loginMode: LoginMode = 'register';
  private selectedCharacter: CharacterType = 'male';
  private selectedMap: MapId = 'rwanda';
  private playerCount = 0;
  private gameStartedAt = 0;
  private completionTime = 0;
  private leaderboard: LeaderboardEntry[] = [];
  private hemiLight: THREE.HemisphereLight;
  private loginScreen: LoginScreen;
  private characterScreen: CharacterSelectScreen;
  private mapScreen: MapSelectScreen;
  private lobbyScreen: LobbyScreen;
  private gameOverScreen: GameOverScreen;
  private completeScreen: CompleteScreen;
  private leaderboardScreen: LeaderboardScreen;

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
    this.showMenu();
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

  private showMenu(): void {
    this.state = GameState.MENU;
    this.hideFlowScreens();
    this.hud.showMenu(() => this.showLogin());
  }

  private showLogin(errorMessage = '', loading = false): void {
    this.state = GameState.LOGIN;
    this.hud.hideScreen();
    this.hideFlowScreens();
    this.loginScreen.show({ mode: this.loginMode, errorMessage, loading }, {
      onToggleMode: (mode) => {
        this.loginMode = mode;
        this.showLogin();
      },
      onLogin: (email) => {
        void this.handleLogin(email);
      },
      onRegister: (email, displayName) => {
        void this.handleRegister(email, displayName);
      },
    });
  }

  private async handleRegister(email: string, displayName: string): Promise<void> {
    if (!isValidEmail(email)) {
      this.showLogin('Please enter a valid email address.');
      return;
    }
    if (!displayName.trim()) {
      this.showLogin('Please enter a display name.');
      return;
    }

    this.showLogin('', true);
    try {
      this.session = await this.api.registerPlayer(email, displayName);
      this.showCharacterSelect();
    } catch (error) {
      console.error(error);
      this.showLogin("We couldn't create your account. Please try again.");
    }
  }

  private async handleLogin(email: string): Promise<void> {
    if (!isValidEmail(email)) {
      this.showLogin('Please enter a valid email address.');
      return;
    }

    this.showLogin('', true);
    try {
      this.session = await this.api.loginPlayer(email);
      this.showCharacterSelect();
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        this.showLogin(error.message);
        return;
      }
      console.error(error);
      this.showLogin("We couldn't log you in. Please try again.");
    }
  }

  private showCharacterSelect(): void {
    this.state = GameState.CHARACTER_SELECT;
    this.hideFlowScreens();
    this.characterScreen.show({ selected: this.selectedCharacter }, {
      onSelect: (type) => {
        this.selectedCharacter = type;
        this.showCharacterSelect();
      },
      onConfirm: (type) => {
        this.selectedCharacter = type;
        this.applyCharacterAppearance();
        this.showMapSelect();
      },
    });
  }

  private showMapSelect(): void {
    this.state = GameState.MAP_SELECT;
    this.hideFlowScreens();
    this.mapScreen.show({ selected: this.selectedMap }, {
      onSelect: (id) => {
        this.selectedMap = id;
        this.showMapSelect();
      },
      onConfirm: (id) => {
        this.selectedMap = id;
        this.applyMapTheme();
        this.enterLobby();
      },
    });
  }

  private enterLobby(): void {
    if (!this.session) {
      this.showLogin('Please log in first.');
      return;
    }

    this.state = GameState.LOBBY;
    this.hideFlowScreens();
    this.playerCount = Math.max(1, this.playerCount);
    this.lobbyScreen.show({
      playerCount: this.playerCount,
      characterType: this.selectedCharacter,
      mapId: this.selectedMap,
      displayName: this.session.displayName,
    });

    this.socket.connect(this.session.sessionId);
    this.socket.joinLobby(
      this.session.playerId,
      this.session.displayName || 'Player',
      this.selectedCharacter,
      this.selectedMap,
    );
    this.socket.playerReady();
  }

  private bindSocket(): void {
    this.socket.on('lobby_update', (message) => {
      const players = (message.players as LobbyPlayer[] | undefined) ?? [];
      this.playerCount = Number(message.playerCount ?? players.length);
      if (this.state === GameState.LOBBY && this.session) {
        this.lobbyScreen.updatePlayerCount(
          this.playerCount,
          this.selectedCharacter,
          this.selectedMap,
          this.session.displayName,
        );
      }
    });

    this.socket.on('game_start', (message) => {
      const tasks = this.normalizeTasks(message.tasks);
      this.startGame(tasks);
    });

    this.socket.on('leaderboard', (message) => {
      this.leaderboard = (message.entries as LeaderboardEntry[] | undefined) ?? [];
      if (this.state === GameState.LEADERBOARD) this.showLeaderboard();
    });

    this.socket.on('game_end', () => {
      if (this.state === GameState.PLAYING || this.state === GameState.COMPLETE || this.state === GameState.GAME_OVER) {
        this.showLeaderboard();
      }
    });
  }

  private startGame(tasks: GameTask[]): void {
    if (this.state === GameState.PLAYING) return;
    const playableTasks = tasks.length > 0 ? tasks : new ChallengeGenerator().generate(2);
    this.state = GameState.PLAYING;
    this.hideFlowScreens();
    this.hud.hideScreen();
    this.scoreManager.reset();
    this.challengeManager.reset();
    this.clearSessionObjects();
    this.seedInventory.clear();
    this.plantQueue = [];
    this.waterFound = false;
    this.gameStartedAt = performance.now();
    this.completionTime = 0;
    this.player.mesh.position.set(0, 0, 6);
    this.applyCharacterAppearance();
    this.applyMapTheme();

    const started = this.challengeManager.startWithTasks(
      playableTasks,
      () => this.onTimeout(),
      () => this.onChallengeUpdate(),
      () => {
        void this.onAllComplete();
      },
      (message) => this.hud.showFeedback(message),
      (task, isFirstTask) => this.onTaskStarted(task, isFirstTask),
      (completedTask, nextTask) => this.onTaskCompleted(completedTask, nextTask),
    );
    this.requiredWaterPerCrop = this.getRequiredWaterPerCrop(started);
    this.createSessionObjects(started);
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
    this.completionTime = this.elapsedSeconds();
    this.hud.hideHUD();
    this.submitResult();
    this.hideFlowScreens();
    this.gameOverScreen.show(
      { score: this.scoreManager.getScore(), currentTask: this.challengeManager.getCurrentTask() },
      {
        onPlayAgain: () => {
          void this.playAgain();
        },
        onLeaderboard: () => this.showLeaderboard(),
      },
    );
  }

  private async onAllComplete(): Promise<void> {
    this.state = GameState.COMPLETE;
    this.completionTime = this.elapsedSeconds();
    this.scoreManager.add(300);
    this.hud.hideHUD();
    this.submitResult();
    this.hideFlowScreens();
    const rank = this.myRank();
    this.completeScreen.show(
      { score: this.scoreManager.getScore(), rank, isTop10: rank != null && rank <= 10 },
      {
        onLeaderboard: () => this.showLeaderboard(),
        onPlayAgain: () => {
          void this.playAgain();
        },
      },
    );
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
    this.hud.updateHUD(this.challengeManager.getCurrentTask(), this.challengeManager.getTimeRemaining(), {
      taskNumber: this.challengeManager.getCompletedTaskCount() + 1,
      taskCount: this.challengeManager.getTaskCount(),
      playerCount: this.playerCount,
      elapsedSeconds: this.elapsedSeconds(),
    });
  }

  private showLeaderboard(): void {
    this.state = GameState.LEADERBOARD;
    this.hud.hideHUD();
    this.hideFlowScreens();
    const rank = this.myRank();
    this.leaderboardScreen.show(
      {
        entries: this.leaderboard,
        playerId: this.session?.playerId,
        yourRank: rank,
        yourScore: this.scoreManager.getScore(),
        isTop10: rank != null && rank <= 10,
      },
      {
        onPlayAgain: () => {
          void this.playAgain();
        },
      },
    );
  }

  private async playAgain(): Promise<void> {
    this.clearSessionObjects();
    this.scoreManager.reset();
    this.challengeManager.reset();
    this.leaderboard = [];
    if (this.session) {
      try {
        this.session = await this.api.startNewSession(this.session.playerId, this.session.email, this.session.displayName);
      } catch (error) {
        console.error(error);
      }
    }
    this.showCharacterSelect();
  }

  private submitResult(): void {
    this.socket.gameComplete(this.scoreManager.getScore(), this.completionTime);
  }

  private myRank(): number | undefined {
    return this.leaderboard.find((entry) => entry.playerId === this.session?.playerId)?.rank;
  }

  private elapsedSeconds(): number {
    if (!this.gameStartedAt) return 0;
    return Math.floor((performance.now() - this.gameStartedAt) / 1000);
  }

  private normalizeTasks(raw: unknown): GameTask[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => {
      const task = item as Partial<GameTask>;
      return {
        id: task.id ?? `task-${index}`,
        type: task.type as TaskType,
        cropType: task.cropType,
        targetAmount: Number(task.targetAmount ?? 1),
        currentAmount: 0,
        timeLimit: Number(task.timeLimit ?? 30),
        scoreReward: Number(task.scoreReward ?? 50),
        description: task.description ?? 'Complete the farm task',
      };
    }).filter((task) => Boolean(task.type));
  }

  private applyCharacterAppearance(): void {
    const option = getCharacterOption(this.selectedCharacter);
    const material = this.player.body.material as THREE.MeshLambertMaterial;
    material.color.setHex(option.bodyColor);
  }

  private applyMapTheme(): void {
    const map = getMapOption(this.selectedMap);
    this.renderer.setClearColor(map.skyColor);
    this.scene.fog = new THREE.Fog(map.skyColor, 38, 70);
    this.hemiLight.color.setHex(map.skyColor);
    this.hemiLight.groundColor.setHex(map.groundColor);
  }

  private hideFlowScreens(): void {
    this.loginScreen.hide();
    this.characterScreen.hide();
    this.mapScreen.hide();
    this.lobbyScreen.hide();
    this.gameOverScreen.hide();
    this.completeScreen.hide();
    this.leaderboardScreen.hide();
  }

  private setupLighting(): THREE.HemisphereLight {
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

    const hemi = new THREE.HemisphereLight(0x8fd3ff, 0x7ec850, 0.35);
    this.scene.add(hemi);
    return hemi;
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
