# AGENTS.md — Member 3: Game Engine, 3D World, Character Models, Map Variants, Instance-Based Gameplay

## Identity

You are **Member 3** of a 3-person team building the FarmQuest event edition.

Your scope covers the Three.js game engine and all 3D content:

- Three.js scene, renderer, camera
- Player character models (male, female, robot variants)
- Map variants (Rwanda, Sudan, Seychelles)
- World building (terrain, buildings, trees, decorations)
- Spawn system for each map
- Instance-based challenge generation (one level, random tasks per instance)
- Game loop integration
- Collision system
- Crop, seed, water source, and NPC models

---

## Context

The existing codebase has a complete Three.js farming game with one terrain layout, one character model, and a 3-level progression system.

**What already exists:**

- `src/game/Game.ts` — main game class (scene, camera, renderer, lighting, game loop)
- `src/player/Player.ts` — procedural low-poly character (head, body, arms, legs, hat)
- `src/player/PlayerController.ts` — keyboard input, movement, collision
- `src/world/World.ts` — terrain, roads, farm, forest, river, buildings, decorations
- `src/world/SpawnManager.ts` — seed spawn points, plot positions, water sources
- `src/world/Seed.ts` — floating collectible seed items
- `src/world/WaterSource.ts` — well/water source interactable
- `src/world/Crop.ts` — plantable, waterable, harvestable crop plots
- `src/world/NPC.ts` — non-player character
- `src/world/CollisionManager.ts` — axis-aligned bounding box collisions
- `src/world/Interactable.ts` — interaction interface
- `src/game/ChallengeGenerator.ts` — generates task sequences from templates
- `src/game/ChallengeManager.ts` — manages task progression and timing
- `src/game/GameTask.ts` — task interface
- `src/game/ScoreManager.ts` — score tracking
- `src/game/GameState.ts` — game state enum
- `src/data/CropType.ts` — MAIZE, CASSAVA, COFFEE
- `src/data/TaskType.ts` — all task type enums
- `src/data/LevelConfig.ts` — 3 level configurations

**What must change:**

1. The 3-level system is replaced by a single instance with random tasks (same difficulty range as current levels)
2. One new character model variants: female and robot (male already exists)
3. Three map variants with different terrain, colors, and decorations
4. The world must accept a map ID and render accordingly
5. The game must receive its task sequence from the server (not generate locally)

---

## Core Responsibilities

### 1. Character Model Variants

**Goal:** Create three visually distinct character models: male, female, robot.

**Current character:** `src/player/Player.ts`

The current character is a generic low-poly humanoid with a straw hat, blue body, skin-colored head, and green pants. This is the "male" character.

**Character type parameter:**

```ts
type CharacterType = 'male' | 'female' | 'robot';
```

**Modify `Player.ts` to accept a character type:**

```ts
class Player {
  constructor(characterType: CharacterType = 'male') {
    // Build character based on type
  }
}
```

**Male character (current — keep as-is):**

- Body: Blue `0x4a90d9`
- Head: Skin `0xf5cba7`
- Limbs: Dark blue `0x2f6fb3`
- Legs: Green `0x315033`
- Hat: Straw yellow `0xd4a017` (brim + top)

**Female character:**

- Body: Purple `0x9b59b6` (slightly narrower torso)
- Head: Skin `0xf0c8a0`
- Limbs: Purple `0x7d3c98`
- Legs: Dark purple `0x6c3483`
- Hair: Dark brown `0x3e2723` (sphere on top instead of hat)
- Hair bun: Small sphere at back of head
- Optional: small flower on hair `0xff69b4`

**Robot character:**

- Body: Silver `0x95a5a6` (box shape, slightly mechanical)
- Head: Metallic `0xbdc3c7` (box instead of sphere)
- Eyes: Glowing cyan `0x00ffff` (small spheres)
- Antenna: Thin cylinder on top with glowing tip `0x00ff88`
- Limbs: Dark grey `0x7f8c8d` (segmented look with small joints)
- Legs: Same grey
- Chest light: Small glowing circle `0x00ff88`
- No hat, no hair

**Implementation approach:**

Create a helper class or factory that builds the character mesh hierarchy:

```ts
class PlayerModel {
  static create(type: CharacterType): CharacterParts {
    switch (type) {
      case 'male': return PlayerModel.createMale();
      case 'female': return PlayerModel.createFemale();
      case 'robot': return PlayerModel.createRobot();
    }
  }

  private static createMale(): CharacterParts {
    // current implementation
  }

  private static createFemale(): CharacterParts {
    // new
  }

  private static createRobot(): CharacterParts {
    // new
  }
}
```

**CharacterParts interface:**

```ts
interface CharacterParts {
  root: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  // Optional extras
  hat?: THREE.Object3D;
  hair?: THREE.Object3D;
  antenna?: THREE.Object3D;
}
```

**The animation system (arm/leg swing) must work for all three characters.** Keep the pivot-based animation but apply it to the parts returned by the factory.

**Files to modify:**
```
src/player/Player.ts           — accept CharacterType, use PlayerModel
```

**Files to create:**
```
src/player/PlayerModel.ts      — character model factory
```

---

### 2. Map Variants

**Goal:** Create three visually distinct map themes.

**Map data:**

```ts
type MapId = 'rwanda' | 'sudan' | 'seychelles';

interface MapTheme {
  id: MapId;
  name: string;
  description: string;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  dirtColor: number;
  roadColor: number;
  treeTrunkColor: number;
  treeFoliageColors: number[];
  waterColor: number;
  waterOpacity: number;
  buildingWallColor: number;
  buildingRoofColor: number;
  fenceColor: number;
  ambientIntensity: number;
  sunIntensity: number;
  hemisphereSkyColor: number;
  hemisphereGroundColor: number;
}
```

**Rwanda (Wet Land) — lush green farmland:**

```ts
const RWANDA_THEME: MapTheme = {
  id: 'rwanda',
  name: 'Rwanda - Wet Land',
  description: 'Lush green hills and fertile farmland',
  skyColor: 0x8fd3ff,
  fogColor: 0x8fd3ff,
  groundColor: 0x7ec850,
  dirtColor: 0xc4a55a,
  roadColor: 0x888888,
  treeTrunkColor: 0x8B4513,
  treeFoliageColors: [0x228B22, 0x2d8b2d, 0x1a7a1a],
  waterColor: 0x3498db,
  waterOpacity: 0.8,
  buildingWallColor: 0xdeb887,
  buildingRoofColor: 0x8B4513,
  fenceColor: 0x8B4513,
  ambientIntensity: 0.62,
  sunIntensity: 1.0,
  hemisphereSkyColor: 0x8fd3ff,
  hemisphereGroundColor: 0x7ec850,
};
```

**Sudan (Desert) — arid, sandy landscape:**

```ts
const SUDAN_THEME: MapTheme = {
  id: 'sudan',
  name: 'Sudan - Desert',
  description: 'Hot, dry desert farmland near an oasis',
  skyColor: 0xf0e68c,
  fogColor: 0xf0e68c,
  groundColor: 0xd4b896,
  dirtColor: 0xc9a96e,
  roadColor: 0xb8a088,
  treeTrunkColor: 0x8B7355,
  treeFoliageColors: [0x8B7355, 0x9e8b6e, 0x7a6b4e],
  waterColor: 0x4fa4c7,
  waterOpacity: 0.6,
  buildingWallColor: 0xd2b48c,
  buildingRoofColor: 0x8B4513,
  fenceColor: 0x8B7355,
  ambientIntensity: 0.7,
  sunIntensity: 1.3,
  hemisphereSkyColor: 0xf0e68c,
  hemisphereGroundColor: 0xd4b896,
};
```

**Seychelles (Water Land) — tropical island:**

```ts
const SEYCHELLES_THEME: MapTheme = {
  id: 'seychelles',
  name: 'Seychelles - Water Land',
  description: 'Tropical island with crystal clear waters',
  skyColor: 0x87ceeb,
  fogColor: 0x87ceeb,
  groundColor: 0xf4e1c1,
  dirtColor: 0xd2b48c,
  roadColor: 0xc9b896,
  treeTrunkColor: 0x8B6914,
  treeFoliageColors: [0x2ecc71, 0x27ae60, 0x1abc9c],
  waterColor: 0x1abc9c,
  waterOpacity: 0.7,
  buildingWallColor: 0xf5f5dc,
  buildingRoofColor: 0xcd853f,
  fenceColor: 0x8B6914,
  ambientIntensity: 0.65,
  sunIntensity: 1.1,
  hemisphereSkyColor: 0x87ceeb,
  hemisphereGroundColor: 0xf4e1c1,
};
```

**Theme registry:**

```ts
export const MAP_THEMES: Record<MapId, MapTheme> = {
  rwanda: RWANDA_THEME,
  sudan: SUDAN_THEME,
  seychelles: SEYCHELLES_THEME,
};
```

**Files to create:**
```
src/data/MapTheme.ts           — map theme definitions
```

**Files to modify:**
```
src/world/World.ts             — accept MapTheme, apply colors
```

---

### 3. World Refactoring for Map Themes

**Goal:** Make `World.ts` theme-aware.

**Current implementation:** All colors are hard-coded in `World.ts`

**New approach:** Pass a `MapTheme` to the `World` constructor and use its colors throughout.

```ts
class World {
  constructor(theme: MapTheme) {
    this.theme = theme;
    this.buildTerrain();
    this.buildRoad();
    // etc.
  }

  private buildTerrain(): void {
    const groundMat = new THREE.MeshLambertMaterial({ color: this.theme.groundColor });
    // ...
  }
}
```

**Visual differences per map:**

| Element | Rwanda | Sudan | Seychelles |
|---------|--------|-------|------------|
| Ground | Lush green | Sandy tan | Beach sand |
| Road | Grey asphalt | Dirt path | Sandy trail |
| Trees | Full green foliage | Sparse dry bushes | Palm trees |
| Water | Blue river | Small oasis pool | Turquoise sea |
| Buildings | Brown farmhouse | Adobe walls | White/bright walls |
| Hay bales | Present | Replaced by rocks | Replaced by shells |
| Flowers | Colorful patches | Cacti/dry plants | Tropical flowers |
| Fence | Brown wood | Dry wood | Bamboo/light wood |

**Map-specific decorations:**

- **Rwanda:** Hay bales, flower patches, full forest
- **Sudan:** Cacti, sand dunes (low mounds), sparse trees, rocks
- **Seychelles:** Palm trees, shells, coral rocks, beach umbrellas

**The collision system must also be updated** to match the new decorations.

**Sudan-specific world changes:**

- Replace trees with sparse desert shrubs
- Add sand dunes (low hemisphere meshes)
- Add a small oasis instead of a full river
- Reduce flower patches, add cacti

**Seychelles-specific world changes:**

- Replace trees with palm trees (cylinder trunk + cone/sphere foliage)
- Expand water area (sea on one side)
- Add beach area
- Add coral/rock formations
- Add beach umbrellas near water

**Files to modify:**
```
src/world/World.ts             — accept MapTheme, use theme colors, map-specific decorations
src/world/CollisionManager.ts  — dynamic obstacles based on map
src/world/SpawnManager.ts      — map-specific spawn points
```

---

### 4. Map-Specific Spawn Points

**Goal:** Each map has its own valid spawn locations for seeds, water, and plots.

**Current spawn points are hard-coded in `SpawnManager.ts`.**

**New approach:**

```ts
interface MapSpawnConfig {
  seedSpawnPoints: THREE.Vector3[];
  plotPoints: THREE.Vector3[];
  waterSpawns: WaterSpawn[];
}

const MAP_SPAWNS: Record<MapId, MapSpawnConfig> = {
  rwanda: {
    seedSpawnPoints: [
      new THREE.Vector3(-10, 0, -5),
      new THREE.Vector3(-13, 0, -2),
      // ... existing points
    ],
    plotPoints: [
      new THREE.Vector3(4.6, 0, -4.2),
      // ... existing points
    ],
    waterSpawns: [
      { name: 'Farm Well', position: new THREE.Vector3(11, 0, 0) },
      { name: 'Forest Pump', position: new THREE.Vector3(-12, 0, -11) },
      { name: 'Road Barrel', position: new THREE.Vector3(-2, 0, 5.8) },
      { name: 'River Pump', position: new THREE.Vector3(14, 0, 7) },
    ],
  },
  sudan: {
    seedSpawnPoints: [
      new THREE.Vector3(-8, 0, -3),
      new THREE.Vector3(-11, 0, 0),
      new THREE.Vector3(2, 0, -6),
      new THREE.Vector3(8, 0, -5),
      new THREE.Vector3(10, 0, 2),
      new THREE.Vector3(-6, 0, 6),
      new THREE.Vector3(3, 0, 7),
      new THREE.Vector3(7, 0, 5),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(-3, 0, 3),
    ],
    plotPoints: [
      new THREE.Vector3(5, 0, -3),
      new THREE.Vector3(6.5, 0, -3),
      new THREE.Vector3(8, 0, -3),
      new THREE.Vector3(5, 0, -1.5),
      new THREE.Vector3(6.5, 0, -1.5),
      new THREE.Vector3(8, 0, -1.5),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(6.5, 0, 0),
      new THREE.Vector3(8, 0, 0),
    ],
    waterSpawns: [
      { name: 'Oasis Pool', position: new THREE.Vector3(12, 0, 5) },
      { name: 'Water Tank', position: new THREE.Vector3(-8, 0, 7) },
      { name: 'Village Well', position: new THREE.Vector3(0, 0, -8) },
      { name: 'Pump Station', position: new THREE.Vector3(-10, 0, -4) },
    ],
  },
  seychelles: {
    seedSpawnPoints: [
      new THREE.Vector3(-8, 0, -4),
      new THREE.Vector3(-11, 0, -1),
      new THREE.Vector3(1, 0, -7),
      new THREE.Vector3(9, 0, -6),
      new THREE.Vector3(11, 0, 3),
      new THREE.Vector3(-7, 0, 7),
      new THREE.Vector3(4, 0, 7),
      new THREE.Vector3(8, 0, 5),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-4, 0, 4),
    ],
    plotPoints: [
      new THREE.Vector3(4.5, 0, -3.5),
      new THREE.Vector3(6, 0, -3.5),
      new THREE.Vector3(7.5, 0, -3.5),
      new THREE.Vector3(4.5, 0, -2),
      new THREE.Vector3(6, 0, -2),
      new THREE.Vector3(7.5, 0, -2),
      new THREE.Vector3(4.5, 0, -0.5),
      new THREE.Vector3(6, 0, -0.5),
      new THREE.Vector3(7.5, 0, -0.5),
    ],
    waterSpawns: [
      { name: 'Beach Tap', position: new THREE.Vector3(14, 0, 6) },
      { name: 'Coconut Well', position: new THREE.Vector3(-10, 0, -9) },
      { name: 'Pier Pump', position: new THREE.Vector3(13, 0, 0) },
      { name: 'Village Tank', position: new THREE.Vector3(-3, 0, 8) },
    ],
  },
};
```

**Modify `SpawnManager` to accept a `MapId`:**

```ts
class SpawnManager {
  private mapId: MapId;

  constructor(mapId: MapId = 'rwanda') {
    this.mapId = mapId;
  }

  generateSeeds(tasks: GameTask[]): SeedSpawn[] {
    const config = MAP_SPAWNS[this.mapId];
    // use config.seedSpawnPoints instead of the old hard-coded array
  }
  // ...
}
```

**Files to modify:**
```
src/world/SpawnManager.ts      — accept MapId, use map-specific spawn points
```

**Files to create:**
```
src/data/MapSpawns.ts          — spawn configurations per map
```

---

### 5. Instance-Based Challenge Generation

**Goal:** Replace the 3-level system with a single game instance that gets a random task sequence.

**Current system:** `ChallengeGenerator` generates tasks based on a level number (1, 2, or 3). `LevelManager` tracks which level the player is on.

**New system:** The server sends a pre-generated task sequence when the game starts. The client does NOT generate its own tasks.

**Changes to `ChallengeManager`:**

Add a method to start with a pre-defined task list:

```ts
startWithTasks(
  tasks: GameTask[],
  onTimeout: () => void,
  onUpdate: () => void,
  onComplete: () => void,
  onFeedback: (message: string) => void,
  onTaskStarted?: (task: GameTask, isFirstTask: boolean) => void,
  onTaskCompleted?: (completedTask: GameTask, nextTask: GameTask | null) => void,
): void {
  this.tasks = tasks;
  this.currentIndex = 0;
  // ... setup callbacks, start first task
}
```

**The existing `start()` method can remain** for backward compatibility, but the game will primarily use `startWithTasks()`.

**Task sequence format (must match Member 1's output):**

```ts
// This is the same GameTask[] interface already defined
interface GameTask {
  id: string;
  type: TaskType;
  cropType?: CropType;
  targetAmount: number;
  currentAmount: number;
  timeLimit: number;
  scoreReward: number;
  description: string;
}
```

The server generates a template (like the current `ChallengeGenerator`), randomizes it, and sends it to all clients. All players in the same instance play the same task sequence.

**Files to modify:**
```
src/game/ChallengeManager.ts   — add startWithTasks() method
```

**Files to potentially deprecate:**
```
src/game/LevelManager.ts       — no longer needed (keep for reference)
src/game/ChallengeGenerator.ts — server handles generation now (keep for server-side use)
src/data/LevelConfig.ts        — no longer needed for client
```

---

### 6. Game.ts Refactoring

**Goal:** Remove the 3-level system, integrate WebSocket, accept server-provided tasks.

**Current `Game.ts` flow:**

1. Constructor → setup scene, show registration
2. Register → startLevel()
3. startLevel() → generate tasks, create objects, begin playing
4. onAllComplete() → check if next level, show level complete or game complete
5. Retry/restart → reset and startLevel()

**New `Game.ts` flow:**

1. Constructor → setup scene, show login
2. Login → show character select
3. Character select → show map select
4. Map select → connect WebSocket, join lobby
5. WebSocket `game_start` → startGame(tasks, mapId)
6. startGame() → apply map theme, create objects, begin playing
7. onAllComplete() → submit result to server, show leaderboard
8. Game over → show timeout screen with play again option
9. Play again → go back to character select (or lobby)

**Key changes:**

- Remove `LevelManager` usage
- Remove `startLevel()` — replace with `startGame(tasks: GameTask[], mapId: MapId)`
- Remove `onAllComplete()` level progression logic
- Add `onGameComplete()` that submits score/time to server via WebSocket
- Add map theme switching: `applyMapTheme(mapId)` updates world colors, sky, fog
- Add character type tracking: `setCharacterType(type)` for next game start

**Game.ts constructor changes:**

```ts
constructor(canvas: HTMLCanvasElement, uiOverlay: HTMLElement) {
  // ... existing setup ...

  this.world = new World(MAP_THEMES.rwanda); // default theme
  this.player = new Player('male'); // default character

  // Show login screen instead of registration
  this.showLoginScreen();
}
```

**Files to modify:**
```
src/game/Game.ts               — major refactor
```

---

### 7. Map Theme Application

**Goal:** Switch the entire scene's visual theme when a map is selected.

**When the player selects a map (before joining lobby):**

1. Store the selected `mapId`
2. Optionally preview the map theme (show a preview or just remember the selection)

**When the game starts (on `game_start` WebSocket message):**

1. Apply the map theme to the renderer:
   ```ts
   this.renderer.setClearColor(theme.skyColor);
   this.scene.fog = new THREE.Fog(theme.fogColor, 38, 70);
   ```
2. Rebuild the world with the new theme:
   ```ts
   this.world = new World(theme);
   this.scene.add(this.world.group);
   ```
3. Apply lighting:
   ```ts
   // Update hemisphere light colors
   this.hemisphereLight.color.setHex(theme.hemisphereSkyColor);
   this.hemisphereLight.groundColor.setHex(theme.hemisphereGroundColor);
   // Update intensities
   this.ambientLight.intensity = theme.ambientIntensity;
   this.sunLight.intensity = theme.sunIntensity;
   ```

**Map-specific crop colors remain the same** (maize is always yellow, coffee is always red). Only the environment changes.

**Files to modify:**
```
src/game/Game.ts               — add applyMapTheme() method
src/world/World.ts             — accept MapTheme in constructor
```

---

### 8. World Building — Map-Specific Details

**Goal:** Each map feels distinct in its 3D environment.

**Shared elements (all maps):**

- Farm fence area
- Farm plots (9 positions)
- Roads
- Buildings (2)
- Rocks
- Player spawn point

**Rwanda-specific:**

- Full green forest with 12 trees (current implementation)
- Hay bales near barn
- Colorful flower patches
- Blue river on the right side
- Dirt patches near farm

**Sudan-specific:**

- Sparse dry trees (3-4 instead of 12)
- Sand dunes (low yellow/brown hemisphere meshes)
- Cacti (green cylinders with spikes)
- Small oasis pool instead of full river
- Adobe-style buildings (tan/sandy walls)
- Scattered rocks

**Seychelles-specific:**

- Palm trees (brown cylinder trunk + green sphere/cone foliage)
- Expanded turquoise water on one side (sea)
- Sandy beach area
- Beach umbrellas (cone + cylinder)
- Shell decorations (small white spheres)
- White/bright buildings
- Coral rock formations

**Implementation:**

Add map-specific decoration methods to `World.ts`:

```ts
private buildDecorations(): void {
  switch (this.theme.id) {
    case 'rwanda':
      this.buildRwandaDecorations();
      break;
    case 'sudan':
      this.buildSudanDecorations();
      break;
    case 'seychelles':
      this.buildSeychellesDecorations();
      break;
  }
}

private buildRwandaDecorations(): void {
  // Hay bales, flowers, full forest
}

private buildSudanDecorations(): void {
  // Cacti, sand dunes, sparse trees, oasis
}

private buildSeychellesDecorations(): void {
  // Palm trees, beach, shells, umbrellas
}
```

**Files to modify:**
```
src/world/World.ts             — add map-specific decoration methods
```

---

### 9. Palm Tree Model (Seychelles)

```ts
private createPalmTree(pos: THREE.Vector3): void {
  const tree = new THREE.Group();

  // Trunk — slightly curved
  const trunkGeom = new THREE.CylinderGeometry(0.1, 0.15, 2.5, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: this.theme.treeTrunkColor });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = 1.25;
  trunk.rotation.z = 0.1; // slight lean
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage — large palm fronds (cones)
  const frondColors = this.theme.treeFoliageColors;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const frond = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.2, 4),
      new THREE.MeshLambertMaterial({ color: frondColors[i % frondColors.length] }),
    );
    frond.position.set(
      Math.cos(angle) * 0.5,
      2.6,
      Math.sin(angle) * 0.5,
    );
    frond.rotation.z = Math.cos(angle) * 0.6;
    frond.rotation.x = Math.sin(angle) * 0.6;
    frond.castShadow = true;
    tree.add(frond);
  }

  tree.position.copy(pos);
  this.group.add(tree);
  this.collision.addBox(`palm-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 1.0, pos.z), new THREE.Vector3(0.5, 2.0, 0.5));
}
```

---

### 10. Cactus Model (Sudan)

```ts
private createCactus(pos: THREE.Vector3): void {
  const cactus = new THREE.Group();

  // Main stem
  const stemGeom = new THREE.CylinderGeometry(0.12, 0.15, 1.2, 6);
  const stemMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
  const stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.y = 0.6;
  stem.castShadow = true;
  cactus.add(stem);

  // Arm
  const armGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 5);
  const arm = new THREE.Mesh(armGeom, stemMat);
  arm.position.set(0.2, 0.8, 0);
  arm.rotation.z = -0.5;
  arm.castShadow = true;
  cactus.add(arm);

  // Spines (small spikes)
  for (let i = 0; i < 6; i++) {
    const spine = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.1, 3),
      new THREE.MeshLambertMaterial({ color: 0x8bc34a }),
    );
    const angle = (i / 6) * Math.PI * 2;
    spine.position.set(Math.cos(angle) * 0.15, 0.4 + (i % 3) * 0.25, Math.sin(angle) * 0.15);
    spine.rotation.z = Math.cos(angle) * 1.2;
    spine.rotation.x = Math.sin(angle) * 1.2;
    cactus.add(spine);
  }

  cactus.position.copy(pos);
  this.group.add(cactus);
  this.collision.addBox(`cactus-${pos.x}-${pos.z}`, new THREE.Vector3(pos.x, 0.5, pos.z), new THREE.Vector3(0.5, 1.0, 0.5));
}
```

---

### 11. Sand Dune Model (Sudan)

```ts
private createSandDune(pos: THREE.Vector3, scale = 1): void {
  const duneGeom = new THREE.SphereGeometry(1.5 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const duneMat = new THREE.MeshLambertMaterial({ color: 0xd4b896 });
  const dune = new THREE.Mesh(duneGeom, duneMat);
  dune.position.copy(pos);
  dune.position.y = 0;
  dune.scale.y = 0.3;
  dune.receiveShadow = true;
  this.group.add(dune);
}
```

---

### 12. Beach Umbrella Model (Seychelles)

```ts
private createBeachUmbrella(pos: THREE.Vector3): void {
  const umbrella = new THREE.Group();

  // Pole
  const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, 2, 6);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.y = 1;
  umbrella.add(pole);

  // Canopy
  const canopyGeom = new THREE.ConeGeometry(1.2, 0.5, 8);
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
  const canopy = new THREE.Mesh(canopyGeom, canopyMat);
  canopy.position.y = 2;
  canopy.castShadow = true;
  umbrella.add(canopy);

  umbrella.position.copy(pos);
  this.group.add(umbrella);
}
```

---

### 13. Oasis Pool Model (Sudan)

```ts
private createOasis(pos: THREE.Vector3): void {
  // Water pool
  const poolGeom = new THREE.CircleGeometry(3, 16);
  const poolMat = new THREE.MeshLambertMaterial({
    color: this.theme.waterColor,
    transparent: true,
    opacity: this.theme.waterOpacity,
  });
  const pool = new THREE.Mesh(poolGeom, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(pos.x, 0.03, pos.z);
  this.group.add(pool);

  // Sandy bank
  const bankGeom = new THREE.RingGeometry(2.8, 4, 16);
  const bankMat = new THREE.MeshLambertMaterial({ color: 0xc9a96e });
  const bank = new THREE.Mesh(bankGeom, bankMat);
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(pos.x, 0.02, pos.z);
  this.group.add(bank);
}
```

---

### 14. Integration with Game.ts

**Game.ts needs to know about map and character selection.**

**Approach: Game.ts exposes methods that Member 2's screens call:**

```ts
class Game {
  setCharacterType(type: CharacterType): void {
    this.characterType = type;
  }

  setMapId(mapId: MapId): void {
    this.selectedMapId = mapId;
  }

  // Called when WebSocket receives game_start
  startGame(tasks: GameTask[], instanceId: string): void {
    const theme = MAP_THEMES[this.selectedMapId];
    this.applyMapTheme(theme);
    this.world = new World(theme);
    this.scene.add(this.world.group);

    this.player = new Player(this.characterType);
    this.scene.add(this.player.mesh);

    this.spawnManager = new SpawnManager(this.selectedMapId);

    // Start with server-provided tasks
    this.challengeManager.startWithTasks(
      tasks,
      () => this.onTimeout(),
      () => this.onChallengeUpdate(),
      () => this.onAllComplete(),
      (message) => this.hud.showFeedback(message),
      (task, isFirst) => this.onTaskStarted(task, isFirst),
      (completed, next) => this.onTaskCompleted(completed, next),
    );

    // Create game objects
    this.createSessionObjects(tasks);
    this.state = GameState.PLAYING;
    this.gameStartTime = performance.now();
  }
}
```

**Files to modify:**
```
src/game/Game.ts               — add setCharacterType(), setMapId(), startGame()
```

---

### 15. Completion Time Tracking

**Goal:** Track how long the player took to complete the game (for leaderboard ranking).

```ts
class Game {
  private gameStartTime = 0;

  startGame(tasks: GameTask[], instanceId: string): void {
    this.gameStartTime = performance.now();
    // ...
  }

  private onAllComplete(): void {
    const completionTime = (performance.now() - this.gameStartTime) / 1000; // seconds
    const score = this.scoreManager.getScore();

    // Send to server via WebSocket
    this.socket.gameComplete(score, completionTime);

    // Show completion screen
    this.state = GameState.COMPLETE;
    // ...
  }
}
```

**Files to modify:**
```
src/game/Game.ts               — add completion time tracking
```

---

### 16. NPC Per Map

**Goal:** Each map has a different NPC appearance.

**Current NPC:** Brown body, golden head, yellow dot above head.

**Map-specific NPCs:**

- **Rwanda:** Farmer with straw hat (current NPC style)
- **Sudan:** Merchant with turban/headwrap
- **Seychelles:** Fisher with net/boat hat

**Implementation:**

Create NPC variants in `NPC.ts`:

```ts
class NPC implements Interactable {
  constructor(position: THREE.Vector3, mapId: MapId = 'rwanda') {
    // Build NPC based on mapId
    switch (mapId) {
      case 'rwanda': this.buildFarmer(); break;
      case 'sudan': this.buildMerchant(); break;
      case 'seychelles': this.buildFisher(); break;
    }
  }
}
```

**Files to modify:**
```
src/world/NPC.ts               — accept MapId, build map-specific NPC
```

---

### 17. File Structure (Final)

```
src/
├── main.ts                          — entry point (modify)
├── api/
│   ├── FarmQuestApi.ts              — REST client (keep)
│   └── GameSocket.ts                — WebSocket client (Member 2 creates)
├── data/
│   ├── CropType.ts                  — crop types (keep)
│   ├── TaskType.ts                  — task types (keep)
│   ├── LevelConfig.ts               — deprecate (keep for reference)
│   ├── MapTheme.ts                  — map theme definitions (new)
│   └── MapSpawns.ts                 — map spawn configs (new)
├── game/
│   ├── Game.ts                      — main orchestrator (major refactor)
│   ├── GameState.ts                 — game states (modify)
│   ├── ChallengeManager.ts          — task progression (modify)
│   ├── ChallengeGenerator.ts        — keep for server reference
│   ├── GameTask.ts                  — task interface (keep)
│   ├── ScoreManager.ts              — score (keep)
│   └── LevelManager.ts              — deprecate
├── player/
│   ├── Player.ts                    — character (modify)
│   ├── PlayerModel.ts               — character factory (new)
│   └── PlayerController.ts          — input (keep)
├── world/
│   ├── World.ts                     — terrain + decorations (major refactor)
│   ├── SpawnManager.ts              — spawn points per map (modify)
│   ├── Seed.ts                      — collectibles (keep)
│   ├── WaterSource.ts               — water (keep)
│   ├── Crop.ts                      — crops (keep)
│   ├── NPC.ts                       — NPC per map (modify)
│   ├── CollisionManager.ts          — collisions (keep)
│   └── Interactable.ts              — interface (keep)
├── ui/
│   ├── HUD.ts                       — task bar (modify)
│   └── screens/                     — UI screens (Member 2 creates)
└── admin/                           — admin page (Member 2 creates)
```

---

### 18. Coordination with Team Members

**What you need from Member 1 (Backend):**

- The task sequence format (should match `GameTask[]`)
- The WebSocket message types for `game_start`, `game_complete`
- Instance ID format
- Map ID format (must match: `'rwanda'`, `'sudan'`, `'seychelles'`)

**What you need from Member 2 (Frontend):**

- The screen transition calls (which methods to call on Game.ts)
- The character type values (must match: `'male'`, `'female'`, `'robot'`)
- The map ID values (must match: `'rwanda'`, `'sudan'`, `'seychelles'`)

**What they need from you:**

- The `Game.ts` public API (methods they can call)
- The character type enum values
- The map ID values
- How the game starts with server-provided tasks

---

### 19. Priority Order

Implement in this exact order:

1. Create `MapTheme.ts` with all three theme definitions
2. Refactor `World.ts` to accept `MapTheme` and use theme colors
3. Add map-specific decoration methods to `World.ts`
4. Create `MapSpawns.ts` with spawn configs per map
5. Update `SpawnManager.ts` to accept `MapId`
6. Create `PlayerModel.ts` factory with all three character variants
7. Update `Player.ts` to accept `CharacterType` and use `PlayerModel`
8. Add `startWithTasks()` to `ChallengeManager.ts`
9. Refactor `Game.ts` to remove level system and add new game flow
10. Add `applyMapTheme()` to `Game.ts`
11. Add completion time tracking to `Game.ts`
12. Update `NPC.ts` with map-specific variants
13. Test all three maps with all three characters
14. Verify WebSocket integration works end-to-end

---

### 20. Testing Checklist

- [ ] Male character renders correctly
- [ ] Female character renders correctly
- [ ] Robot character renders correctly
- [ ] All three characters have working arm/leg animation
- [ ] All three characters rotate toward movement direction
- [ ] Rwanda map loads with green terrain
- [ ] Sudan map loads with sandy terrain
- [ ] Seychelles map loads with beach terrain
- [ ] Rwanda has full forest
- [ ] Sudan has sparse trees and cacti
- [ ] Seychelles has palm trees and beach
- [ ] Rwanda river renders correctly
- [ ] Sudan oasis renders correctly
- [ ] Seychelles sea renders correctly
- [ ] Spawn points work on all three maps
- [ ] Seeds spawn at valid positions on all maps
- [ ] Water sources appear at correct locations per map
- [ ] Farm plots are accessible on all maps
- [ ] Collision works on all maps
- [ ] Buildings render correctly per map theme
- [ ] NPC appears correctly per map
- [ ] Task sequence received from server starts the game
- [ ] Game completes and sends score/time to server
- [ ] Score tracking works
- [ ] Timer works
- [ ] Game over on timeout works
- [ ] Play again restarts with new tasks
- [ ] All three maps feel visually distinct
- [ ] All three characters are visually distinct
- [ ] No visual glitches when switching maps
- [ ] Performance is stable with all decorations loaded

---

### 21. Definition of Done

Member 3 is done when:

1. Three visually distinct character models exist (male, female, robot)
2. All three characters animate correctly (arm/leg swing, facing direction)
3. Three visually distinct maps exist (Rwanda, Sudan, Seychelles)
4. Each map has unique terrain colors, trees, decorations, and water features
5. The spawn system works correctly for each map
6. The game accepts a server-provided task sequence and plays through it
7. The 3-level system is replaced by single-instance play
8. Completion time is tracked and sent to the server
9. The game can be started, played, completed, and restarted
10. Performance remains stable across all map variants
11. All map-specific decorations (cacti, palm trees, sand dunes, etc.) render correctly
12. The NPC varies by map
