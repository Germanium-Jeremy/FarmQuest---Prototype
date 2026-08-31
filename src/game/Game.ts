import * as THREE from 'three';
import { GameState, Challenge } from './GameState';
import { ChallengeManager } from './ChallengeManager';
import { ScoreManager } from './ScoreManager';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { World } from '../world/World';
import { NPC } from '../world/NPC';
import { Seed } from '../world/Seed';
import { WaterSource } from '../world/WaterSource';
import { Crop } from '../world/Crop';
import { Interactable } from '../world/Interactable';
import { HUD } from '../ui/HUD';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock: THREE.Clock;
  private hud: HUD;
  private player: Player;
  private playerController: PlayerController;
  private world: World;
  private npc: NPC;
  private maizeSeed: Seed;
  private coffeeSeed: Seed;
  private waterSource: WaterSource;
  private crop: Crop;
  private scoreManager: ScoreManager;
  private challengeManager: ChallengeManager;
  private state: GameState = GameState.MENU;
  private interactables: Interactable[] = [];
  private nearestInteractable: Interactable | null = null;

  constructor(canvas: HTMLCanvasElement, uiOverlay: HTMLElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87ceeb);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 30, 60);

    // Camera (orthographic for 2.5D)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 14;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1, 100
    );
    this.camera.position.set(12, 16, 18);
    this.camera.lookAt(0, 0, 0);
    this.camera.zoom = 1.2;
    this.camera.updateProjectionMatrix();

    // Lighting
    this.setupLighting();

    // Clock
    this.clock = new THREE.Clock();

    // Managers
    this.scoreManager = new ScoreManager();
    this.challengeManager = new ChallengeManager(this.scoreManager);

    // HUD
    this.hud = new HUD(uiOverlay, this.scoreManager, this.challengeManager);

    // Player
    this.player = new Player();
    this.playerController = new PlayerController();
    this.scene.add(this.player.mesh);

    // World
    this.world = new World();
    this.scene.add(this.world.group);

    // Create interactable objects
    this.npc = new NPC(new THREE.Vector3(-3, 0, 2));
    this.maizeSeed = new Seed(new THREE.Vector3(6, 0, -3), 'maize');
    this.coffeeSeed = new Seed(new THREE.Vector3(-12, 0, -9), 'coffee');
    this.waterSource = new WaterSource(new THREE.Vector3(10, 0, 0));
    this.crop = new Crop(new THREE.Vector3(6, 0, -1));

    this.scene.add(this.npc.mesh);
    this.scene.add(this.maizeSeed.mesh);
    this.scene.add(this.coffeeSeed.mesh);
    this.scene.add(this.waterSource.mesh);
    this.scene.add(this.crop.mesh);

    this.setupInteractions();

    // Window resize
    window.addEventListener('resize', () => this.onResize());

    // Show menu
    this.hud.showMenu();
    this.hud.hideHUD();

    // Start button handler will be set in setupInteractions
  }

  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(10, 15, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);

    // Hemisphere light for sky/ground color
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x7ec850, 0.3);
    this.scene.add(hemi);
  }

  private setupInteractions(): void {
    // NPC gives seeds
    this.npc.setOnInteract(() => {
      if (this.challengeManager.currentChallenge() === Challenge.FIND_SEED) {
        this.challengeManager.completeChallenge();
        this.hud.hideScreen();
      }
    });

    // Coffee seed (optional bonus)
    this.coffeeSeed.setOnInteract(() => {
      this.scoreManager.add(100); // Bonus
    });

    // Maize seed from forest (alternative path)
    this.maizeSeed.setOnInteract(() => {
      if (this.challengeManager.currentChallenge() === Challenge.FIND_SEED) {
        this.challengeManager.completeChallenge();
        this.hud.hideScreen();
      }
    });

    // Water source
    this.waterSource.setOnInteract(() => {
      if (this.challengeManager.currentChallenge() === Challenge.FIND_WATER) {
        this.crop.plantCrop();
        this.challengeManager.completeChallenge();
        this.hud.hideScreen();
      }
    });

    // Crop harvest
    this.crop.setOnInteract(() => {
      if (this.challengeManager.currentChallenge() === Challenge.HARVEST) {
        this.challengeManager.completeChallenge();
        this.hud.hideScreen();
      }
    });

    // Add to interactables
    this.interactables = [this.npc, this.maizeSeed, this.coffeeSeed, this.waterSource, this.crop];
  }

  startGame(): void {
    this.state = GameState.PLAYING;
    this.scoreManager.reset();
    this.challengeManager.reset();
    this.hud.hideScreen();

    // Reset objects
    this.player.mesh.position.set(0, 0, 6);
    this.npc.mesh.visible = true;
    this.npc.reset();
    this.maizeSeed.reset();
    this.coffeeSeed.reset();
    this.waterSource.reset();
    this.crop.reset();

    // Re-register interactables
    this.interactables = [this.npc, this.maizeSeed, this.coffeeSeed, this.waterSource, this.crop];

    // Start first challenge
    this.challengeManager.start(
      () => this.onTimeout(),
      () => this.onChallengeUpdate(),
      () => this.onAllComplete()
    );
  }

  private onTimeout(): void {
    this.state = GameState.GAME_OVER;
    this.hud.hideHUD();
    this.hud.showGameOver(() => this.startGame());
  }

  private onAllComplete(): void {
    this.state = GameState.COMPLETE;
    this.hud.hideHUD();
    this.hud.showComplete(() => this.startGame());
  }

  private onChallengeUpdate(): void {
    const config = this.challengeManager.currentConfig();
    if (config) {
      this.hud.updateHUD(config.taskText, this.challengeManager.getTimeRemaining());
    }
  }

  private findNearestInteractable(): Interactable | null {
    const playerPos = this.player.getPosition();
    let nearest: Interactable | null = null;
    let nearestDist = Infinity;

    for (const obj of this.interactables) {
      if (!obj.isAvailable()) continue;
      const dist = playerPos.distanceTo(obj.mesh.position);
      if (dist < this.player.interactRange && dist < nearestDist) {
        nearest = obj;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  private handleInteraction(): void {
    if (this.state !== GameState.PLAYING) return;
    if (this.nearestInteractable) {
      this.nearestInteractable.interact();
    }
  }

  private updateCamera(): void {
    const playerPos = this.player.getPosition();
    const targetX = playerPos.x + 12;
    const targetZ = playerPos.z + 18;

    // Smooth follow
    this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
    this.camera.position.y = 16;

    this.camera.lookAt(playerPos.x, 0, playerPos.z);
    this.camera.updateProjectionMatrix();
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);

    const aspect = w / h;
    const frustumSize = 14;
    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.state === GameState.PLAYING) {
      // Player movement
      this.playerController.update(delta, this.player, this.world.bounds);

      // Challenge timer
      this.challengeManager.update(delta);

      // Update seed animations
      this.maizeSeed.update(time);
      this.coffeeSeed.update(time);

      // Find nearest interactable
      this.nearestInteractable = this.findNearestInteractable();
      if (this.nearestInteractable) {
        this.hud.showPrompt(this.nearestInteractable.label);
      } else {
        this.hud.hidePrompt();
      }

      // Handle interaction
      if (this.playerController.consumeInteract()) {
        this.handleInteraction();
      }

      // Camera follow
      this.updateCamera();
    }

    this.renderer.render(this.scene, this.camera);
  }

  getStartButtonHandler(): (() => void) | null {
    return () => this.startGame();
  }
}
