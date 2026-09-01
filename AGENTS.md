# AGENTS.md — FarmQuest Three.js Prototype

## Mission

Build a **1–2 minute FarmQuest web game prototype** using Three.js.

FarmQuest is a stylized low-poly 3D agriculture game where players complete a short sequence of farming challenges while learning basic agricultural processes.

The experience should feel different each time the player starts or replays the game.

The overall gameplay loop is:

**Explore → Collect Seeds → Plant → Find Water → Water Crops → Harvest → Score → Reward**

The prototype should prioritize:

* Fast gameplay
* Clear objectives
* Replayability
* Visual quality
* Simple controls
* Educational agriculture content
* Reliable browser performance

---

## Technology

Recommended:

* TypeScript
* Vite
* Three.js
* HTML/CSS
* GLB/GLTF assets
* Three.js GLTFLoader
* Three.js animation system when animated models exist

React may be added later only if it does not complicate the prototype.

Do not use Pygame.

Do not recreate the environment using fake 2D sprites.

The game world must remain fully 3D.

---

# Visual Direction

Target a Township-like stylized farming world:

* Low-poly models
* Elevated 2.5D-style camera
* Slight downward viewing angle
* Orthographic camera preferred initially
* Bright environment
* Clear roads and landmarks
* Simple shadows
* Readable crops and interaction objects
* Colorful agricultural environment

Example layout:

```text
              FOREST

         🌳 🌳 🌳 🌳
          ☕    🌱

             │

        ─── ROAD ───

  🌽 MAIZE FARM      💧 WELL

  🌿 CASSAVA FARM    🏠 NPC

         🌱 FIELD

            👤
          PLAYER
```

The world is fully 3D.

Keep the map compact so players can reach objectives quickly.

---

# Core Game Flow

A complete game should normally take approximately:

**60–120 seconds**

Unlike the first prototype, every gameplay session should not use exactly the same challenge sequence.

A typical run might be:

```text
START
  ↓
FIND MAIZE SEED
  ↓
PLANT MAIZE
  ↓
FIND WATER
  ↓
WATER CROP
  ↓
HARVEST
  ↓
FINAL SCORE
  ↓
REWARD
```

Another run could be:

```text
START
  ↓
FIND 3 MAIZE SEEDS
  ↓
FIND 4 CASSAVA SEEDS
  ↓
FIND 2 COFFEE BEANS
  ↓
PLANT SEEDS
  ↓
WATER CROPS TWICE
  ↓
HARVEST
  ↓
FINAL SCORE
  ↓
REWARD
```

The game should generate or select a different task sequence when a new game begins.

Replay should also generate a fresh challenge sequence.

---

# Dynamic Task System

Do not hard-code the game around only:

```text
FIND_SEED
FIND_WATER
HARVEST
```

Instead create a reusable task/challenge system.

Suggested task types:

```ts
enum TaskType {
    COLLECT_SEED,
    COLLECT_MULTIPLE_SEEDS,
    PLANT_SEED,
    PLANT_MULTIPLE_SEEDS,
    FIND_WATER,
    WATER_CROP,
    WATER_CROP_MULTIPLE,
    HARVEST_CROP,
    HARVEST_MULTIPLE
}
```

Tasks should contain configuration data.

Example:

```ts
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

Example generated task:

```ts
{
    id: "collect-maize",
    type: TaskType.COLLECT_MULTIPLE_SEEDS,
    cropType: CropType.MAIZE,
    targetAmount: 3,
    currentAmount: 0,
    timeLimit: 30,
    scoreReward: 150,
    description: "Find 3 maize seeds"
}
```

The ChallengeManager should progress through the generated task list.

---

# Crop Types

The prototype must support multiple crops.

Minimum required crops:

```ts
enum CropType {
    MAIZE,
    CASSAVA,
    COFFEE
}
```

Additional crops may be added later.

Each crop should have recognizable visual differences.

For example:

### Maize

Use:

* Yellow or golden seed/corn icon
* Small maize plant model
* Tall green crop when harvestable

### Cassava

Use:

* Brown/tan seed or cutting indicator
* Broad green cassava leaves
* Root crop representation when harvested

### Coffee

Use:

* Coffee bean collectible
* Coffee plant
* Red coffee cherries or beans

Coffee may still act as a rarer or higher-value crop in some tasks.

---

# Challenge Generation

Create a ChallengeGenerator or similar system.

Suggested file:

```text
src/game/ChallengeGenerator.ts
```

At the beginning of each run, generate a sequence of tasks.

The sequence should still make agricultural sense.

For example:

Correct:

```text
Collect seed
↓
Plant seed
↓
Find water
↓
Water plant
↓
Harvest
```

Avoid impossible sequences such as:

```text
Harvest
↓
Collect seed
↓
Plant
```

Challenge generation should use templates rather than completely random ordering.

Example templates:

```text
TEMPLATE A

Collect 1 maize seed
Plant maize
Find water
Water maize
Harvest maize
```

```text
TEMPLATE B

Collect 3 maize seeds
Collect 2 cassava seeds
Plant collected seeds
Find water
Water crops twice
Harvest crops
```

```text
TEMPLATE C

Collect 2 coffee beans
Collect 3 maize seeds
Plant seeds
Find water
Water crops
Harvest
```

```text
TEMPLATE D

Find cassava seed
Plant cassava
Find water
Water cassava twice
Harvest cassava
```

The system may randomly choose a template and then randomize quantities within reasonable limits.

Example ranges:

```text
Seeds required: 1–4

Water actions: 1–2

Harvest targets: 1–4
```

Do not generate extremely long challenge sequences.

The complete run should remain approximately 1–2 minutes.

---

# Dynamic Spawn Locations

Seed and water locations must change between gameplay sessions.

Players should not be able to memorize exact collectible locations.

At the start of each run:

1. Select valid spawn locations.
2. Shuffle/randomize them.
3. Assign seeds and important interactables to those locations.

Example:

```ts
const seedSpawnPoints = [
    spawnA,
    spawnB,
    spawnC,
    spawnD,
    spawnE,
    spawnF
];
```

Shuffle the spawn points:

```ts
shuffle(seedSpawnPoints);
```

Then assign required collectibles.

Do not place objects using unrestricted random X/Z coordinates.

Instead use predefined valid spawn zones or spawn points.

This avoids:

* Seeds inside houses
* Seeds inside trees
* Water inside buildings
* Objects outside the map
* Impossible objectives

---

# Water Source Randomization

Water should also change location between runs.

Possible water sources:

* Well
* Water tank
* Pump
* Small river
* Water barrel

The game may contain several potential water locations.

At game start, choose one or more active water sources.

Example:

```text
Run 1:
Farm well active

Run 2:
Forest pump active

Run 3:
Water tank near house active
```

The objective marker should guide the player enough that finding water remains fun rather than frustrating.

---

# Player Character

Do not use only:

```text
Sphere = head
Cuboid = body
```

If a proper GLB character is unavailable, construct a better low-poly placeholder character.

Minimum procedural character body:

```text
Head
Body / torso
Left arm
Right arm
Left leg
Right leg
```

Optional:

```text
Hair
Hat
Hands
Shoes
Backpack
```

Suggested hierarchy:

```text
PlayerRoot

├── Body
├── Head
├── LeftArmPivot
│   └── LeftArm
├── RightArmPivot
│   └── RightArm
├── LeftLegPivot
│   └── LeftLeg
└── RightLegPivot
    └── RightLeg
```

Use simple geometry initially:

```text
Head: SphereGeometry

Body: BoxGeometry

Arms: BoxGeometry

Legs: BoxGeometry
```

The result should resemble a simple low-poly human character rather than a sphere sitting on a single cube.

---

# Procedural Running Animation

If a fully animated GLB character is unavailable, animate the placeholder character programmatically.

When the player moves:

* Left arm swings forward while right arm swings backward.
* Right arm swings forward while left arm swings backward.
* Left leg swings opposite the left arm.
* Right leg swings opposite the right arm.

Example concept:

```ts
const swing = Math.sin(time * runSpeed) * swingAmount;

leftArm.rotation.x = swing;
rightArm.rotation.x = -swing;

leftLeg.rotation.x = -swing;
rightLeg.rotation.x = swing;
```

The player should visually appear to walk/run instead of sliding across the ground.

When the player stops:

* Arms return toward neutral.
* Legs return toward neutral.
* Optional subtle idle movement may occur.

Do not make the animation exaggerated enough to look broken.

---

# Character Facing Direction

Player should rotate toward movement direction.

For example:

```text
W / Up     → face north
S / Down   → face south
A / Left   → face west
D / Right  → face east
```

For diagonal movement, smoothly rotate toward the movement vector.

Avoid instantly snapping if smooth rotation is easy to implement.

---

# Character Animation with GLB

If a correctly rigged animated GLB exists, use Three.js AnimationMixer.

Preferred animations:

* Idle
* Walk
* Run
* Interaction
* Harvest if available

If rigging is not ready:

Use the procedural low-poly character and procedural arm/leg movement.

Character rigging must not block completion of the prototype.

---

# Player Controls

Implement:

```text
WASD / Arrow Keys → Move

E / Space → Interact
```

Player should have:

* Keyboard movement
* World boundaries
* Basic obstacle collision
* Facing direction
* Interaction radius
* Running/walking animation
* Camera follow

Keep controls responsive and simple.

---

# Interaction System

Use a reusable interaction pattern.

Example:

```ts
interface Interactable {
    interact(player: Player): void;
}
```

Possible interactables:

```text
NPC

Seed

Water source

Planting plot

Crop

Coffee bean

Cassava seed

Maize seed
```

Examples:

```text
NPC → gives seed

Seed → collected

Planting plot → plant selected seed

Well → collect/use water

Crop → water

Crop → harvest
```

A simple distance check is sufficient.

---

# Seed Collection

Collectibles should clearly show their crop type.

Seed entities should contain something similar to:

```ts
class Seed {
    cropType: CropType;
    value: number;
    collected: boolean;
}
```

When collected:

```text
Maize Seed Collected!

2 / 3

+50 Points
```

Then update the task progress.

Example:

```text
TASK

FIND 3 MAIZE SEEDS

2 / 3
```

---

# Planting System

After collecting the required seeds, some challenges should require planting.

Player approaches a valid farm plot and interacts.

Example prompt:

```text
[E] Plant Maize
```

After planting:

* Seed disappears from inventory.
* Small crop appears.
* Task progress updates.
* Plant becomes available for watering tasks.

Do not create a complex inventory system.

A simple internal seed count is enough.

---

# Watering System

Watering may require one or multiple interactions.

Examples:

```text
Water maize once

Water cassava twice

Water all crops

Water 3 crops
```

A crop should visually change slightly when watered.

Possible feedback:

* Small splash particles
* Temporary blue particles
* Crop becomes slightly larger
* Soil becomes darker
* Floating "+ Watered" text

Do not implement realistic crop waiting times.

Crop progression should happen immediately or within a few seconds.

---

# Harvest System

After required watering is complete, crops become harvestable.

Example prompt:

```text
[E] Harvest Maize
```

Harvest should:

* Update task progress
* Add score
* Play visual feedback
* Remove or change crop model

Example:

```text
MAIZE HARVESTED

+150 POINTS
```

---

# Challenge Manager

Suggested structure:

```text
src/game/ChallengeManager.ts
```

ChallengeManager owns:

```text
Current task
Task list
Task progress
Timer
Completion
Task transitions
Timeout
Game completion
```

Example:

```ts
class ChallengeManager {
    tasks: GameTask[];
    currentTaskIndex: number;
    timeRemaining: number;

    getCurrentTask(): GameTask;

    update(delta: number): void;

    registerProgress(
        taskType: TaskType,
        cropType?: CropType,
        amount?: number
    ): void;

    completeCurrentTask(): void;

    startNextTask(): void;

    failCurrentTask(): void;
}
```

When a task finishes:

```text
TASK COMPLETE!

+100 POINTS
```

Then automatically begin the next task after short feedback.

---

# Timers

Each task may have its own timer.

Example:

```text
Find 3 maize seeds — 30 seconds

Find water — 20 seconds

Water crops — 25 seconds

Harvest crops — 30 seconds
```

Timers should be configurable from the task definition.

Do not hard-code every challenge to the original:

```text
30
20
30
```

Some tasks may receive slightly longer timers depending on quantity.

Example:

```ts
timeLimit =
    baseTime +
    targetAmount * extraTimePerTarget;
```

Keep total gameplay within approximately two minutes.

---

# Score System

Use a ScoreManager.

Suggested scoring:

```text
Collect normal seed: +50

Rare coffee collectible: +75 or +100

Complete seed task: +100

Plant crop: +50

Find water: +100

Water crop: +50

Harvest crop: +150

Complete full game: bonus points
```

Exact numbers may be tuned during playtesting.

The score should always be visible.

---

# HUD

Use HTML/CSS over the Three.js canvas.

The current task must be one of the most visually prominent elements on screen.

Example:

```text
┌─────────────────────────────────────┐
│ CURRENT TASK                        │
│ 🌽 FIND 3 MAIZE SEEDS              │
│                                     │
│ PROGRESS: 2 / 3                     │
│ TIME: 00:18                         │
│ ⭐ SCORE: 250                       │
└─────────────────────────────────────┘
```

Do not display the objective as small secondary text.

The player must immediately understand:

```text
WHAT DO I NEED TO DO?
```

Suggested hierarchy:

```text
CURRENT TASK

large task description

task progress

timer

score
```

---

# Objective Feedback

When progress occurs, display short feedback.

Examples:

```text
🌽 MAIZE SEED FOUND

1 / 3
```

```text
💧 CROP WATERED

1 / 2
```

```text
🌱 CASSAVA PLANTED
```

```text
🌽 HARVEST COMPLETE

+150 POINTS
```

Keep feedback visible briefly without blocking gameplay.

---

# Interaction Prompt

When near something relevant:

```text
[E] Collect Maize Seed
```

```text
[E] Collect Coffee Bean
```

```text
[E] Plant Cassava
```

```text
[E] Use Well
```

```text
[E] Water Crop
```

```text
[E] Harvest
```

Interaction prompts should only appear when the object is within interaction distance.

---

# Game State

Use simple global game states:

```ts
enum GameState {
    MENU,
    PLAYING,
    GAME_OVER,
    COMPLETE
}
```

Tasks themselves are managed separately.

Do not create a separate global game state for every possible task.

---

# Game Over

If the timer reaches zero:

```text
TIME'S UP!

FINAL SCORE: 250

TRY AGAIN
```

Provide a large replay button:

```text
[ PLAY AGAIN ]
```

When selected:

1. Reset score.
2. Reset player.
3. Clear previous collectibles.
4. Clear previous crops.
5. Generate a new task sequence.
6. Randomize seed locations.
7. Randomize active water locations.
8. Restart the game.

Replay must not simply restore exactly the same scenario.

---

# Game Completion

When every task has been completed, show a clear congratulation screen.

Required message concept:

```text
🎉 CONGRATULATIONS!

YOU COMPLETED ALL FARMQUEST TASKS!

FINAL SCORE: 650

YOU CAN NOW CLAIM YOUR COUPON.

🎁 REWARD

FREE COFFEE ☕

[ CLAIM COUPON ]

[ PLAY AGAIN ]
```

The congratulation message must explicitly communicate that:

```text
The player finished all tasks.
```

and:

```text
The player can now claim a coupon/reward.
```

The first prototype may use a mock coupon button.

Do not implement real coupon validation yet.

---

# Replay

Replay must exist on both:

```text
GAME OVER
```

and:

```text
GAME COMPLETE
```

The replay button should start a fresh session.

Example:

```text
[ PLAY AGAIN ]
```

A replay must:

* Generate different tasks where possible
* Randomize seed locations
* Randomize water locations
* Reset score
* Reset timer
* Reset crops
* Reset collected items
* Reset player position

---

# Randomization Rules

Randomization should improve replayability without making gameplay unfair.

Do:

```text
Random task templates

Random seed quantities

Random seed locations

Random active water source

Optional random bonus coffee

Small variations in scoring
```

Do not:

```text
Generate impossible challenges

Place required collectibles outside the map

Hide required objects excessively

Create tasks requiring unavailable crops

Place objects inside buildings

Create extremely long challenge lists
```

Always validate generated tasks before starting the run.

---

# World Design

Keep the environment compact.

Suggested regions:

```text
Central Farm

Maize Field

Cassava Field

Coffee Area

Forest

NPC House

Water Area

Road Network
```

Players should normally reach any major area within approximately 5–10 seconds.

Avoid a large open world.

---

# Objective Placement

Create predefined zones.

Example:

```ts
interface SpawnZone {
    id: string;
    positions: THREE.Vector3[];
    allowedTypes: SpawnType[];
}
```

Possible spawn zones:

```text
Forest edge

Behind NPC house

Near maize farm

Near cassava field

Near road

Near barn

Near trees

Near well

Near coffee plants
```

Randomly select valid locations every run.

---

# Visual Objective Guidance

Required objects should be discoverable.

Use where helpful:

* Floating crop icon
* Glow
* Small particles
* Gentle bouncing
* Billboard icon
* Highlight circle

Do not turn the game into a difficult hidden-object game.

Players should explore, but they should not become stuck.

---

# Camera

Start with an OrthographicCamera positioned above and diagonally away from the player.

Camera should:

* Follow player
* Keep player visible
* Show nearby landmarks
* Avoid excessive empty space
* Avoid clipping through buildings
* Preserve the 2.5D appearance

The agent establishes initial values.

The human makes final visual adjustments.

---

# Three.js Scene

Scene should contain:

```text
Terrain

Roads

Farm plots

Forest

Water areas

Buildings

NPC

Player

Maize crops

Cassava crops

Coffee plants

Lighting

Collectibles

Interaction markers
```

Use reusable asset loading.

Do not duplicate model-loading logic.

---

# Architecture

Keep architecture understandable.

Suggested structure:

```text
src/

├── main.ts

├── game/
│   ├── Game.ts
│   ├── GameState.ts
│   ├── ChallengeManager.ts
│   ├── ChallengeGenerator.ts
│   ├── GameTask.ts
│   └── ScoreManager.ts

├── player/
│   ├── Player.ts
│   ├── PlayerModel.ts
│   └── PlayerController.ts

├── world/
│   ├── World.ts
│   ├── SpawnManager.ts
│   ├── Interactable.ts
│   ├── NPC.ts
│   ├── Seed.ts
│   ├── WaterSource.ts
│   ├── PlantingPlot.ts
│   └── Crop.ts

├── data/
│   ├── CropType.ts
│   ├── TaskType.ts
│   └── ChallengeTemplates.ts

├── ui/
│   ├── HUD.ts
│   ├── GameOverScreen.ts
│   └── RewardScreen.ts

└── assets/
```

Avoid excessive abstraction.

---

# Spawn Manager

Create:

```text
SpawnManager.ts
```

It should handle:

```text
Seed spawn points

Coffee spawn points

Water source activation

Optional bonus item positions

Spawn validation
```

Example:

```ts
class SpawnManager {

    getRandomSeedPosition(
        excludedPositions?: THREE.Vector3[]
    ): THREE.Vector3;

    chooseWaterSource(): WaterSource;

    reset(): void;
}
```

Do not allow multiple required collectibles to occupy the exact same location.

---

# NPC

NPC may participate in some challenge templates.

Examples:

```text
Talk to farmer to receive maize seed.
```

or:

```text
Farmer gives the player a cassava cutting.
```

NPC interaction should not be mandatory in every run.

This helps sessions feel different.

---

# Rare Coffee Challenge

Coffee may be:

```text
Required during some runs
```

or:

```text
Optional bonus during other runs
```

Example optional bonus:

```text
BONUS

Find the hidden coffee bean.

+200 points
```

Do not hide required coffee excessively.

---

# Reward Prototype

Use a mock reward initially.

Example:

```text
🎉 FARMQUEST COMPLETE

SCORE: 650

ALL TASKS COMPLETED!

YOU CAN NOW CLAIM YOUR COUPON.

🎁 REWARD

FREE COFFEE ☕

[ CLAIM COUPON ]

[ PLAY AGAIN ]
```

Do not integrate:

```text
Real email

Real QR generation

Production coupon service
```

until gameplay is stable.

---

# Backend Security

Never put secrets in browser code.

Never include:

* Database passwords
* Private API keys
* Email credentials
* JWT signing secrets
* Admin credentials

Eventually:

```text
Browser
   ↓
Submit Game Result
   ↓
Backend validates
   ↓
Backend determines reward
   ↓
Coupon generated
```

The backend, not the browser, should make final reward decisions.

---

# Performance

Prefer:

* Low-poly models
* GLB
* Small textures
* Compressed textures
* Limited dynamic lights
* Simple shadows
* Simple collisions
* Small scene
* Limited particles
* Reused geometries/materials

Avoid creating a separate complex mesh for every repeated crop if instancing can be used later.

The first priority remains stable event performance.

---

# Mobile

Mobile support is a later prototype phase.

Eventually support:

```text
Virtual joystick

Interaction button

Responsive HUD
```

Desktop keyboard controls should be completed first.

---

# Web Distribution

Target:

```text
QR CODE

↓

FarmQuest URL

↓

Game Loads

↓

Player Completes Random Challenges

↓

Final Score

↓

Coupon Reward
```

The prototype should remain deployable as a static web application.

---

# Development Phases

## Phase 1

Create the basic 3D farming world.

## Phase 2

Create improved low-poly player.

Add:

```text
Head
Body
Arms
Legs
```

## Phase 3

Implement player movement and procedural running animation.

## Phase 4

Implement maize, cassava and coffee collectibles.

## Phase 5

Implement randomized spawn locations.

## Phase 6

Implement dynamic ChallengeManager and task generation.

## Phase 7

Implement planting.

## Phase 8

Implement water collection and watering.

## Phase 9

Implement harvesting.

## Phase 10

Implement scoring and HUD.

## Phase 11

Implement game over and replay.

## Phase 12

Implement congratulation and coupon reward mock.

## Phase 13

Test multiple generated game sessions.

## Phase 14

Mobile controls and responsive UI.

## Phase 15

Backend integration.

---

# Do Not Build Yet

Do not build:

* Multiplayer
* Large open world
* Complex farming economy
* Crafting
* Large inventory
* Character customization
* Advanced NPC AI
* Realistic crop growth simulation
* Weather simulation
* Complex physics
* Production authentication
* Real coupon infrastructure
* Email infrastructure
* Real payment integration

---

# Testing Checklist

## Scene

* [ ] Browser loads
* [ ] 3D scene loads
* [ ] Terrain appears
* [ ] Buildings appear
* [ ] Crops appear
* [ ] Water sources appear

## Player

* [ ] Player appears
* [ ] Player has head
* [ ] Player has body
* [ ] Player has two arms
* [ ] Player has two legs
* [ ] Player moves
* [ ] Player rotates toward movement
* [ ] Arms move while running
* [ ] Legs move while running
* [ ] Character stops animation when idle
* [ ] Player stays inside world boundaries

## Camera

* [ ] Camera follows player
* [ ] Camera does not clip badly
* [ ] Nearby objectives remain readable
* [ ] 2.5D appearance is preserved

## Crops

* [ ] Maize works
* [ ] Cassava works
* [ ] Coffee works
* [ ] Different crop types are visually recognizable

## Randomization

* [ ] Seed locations change between runs
* [ ] Water location changes between runs
* [ ] Objects never spawn outside valid areas
* [ ] Objects never spawn inside buildings
* [ ] Required collectibles remain reachable

## Tasks

* [ ] Task sequence changes between runs
* [ ] Single-seed tasks work
* [ ] Multiple-seed tasks work
* [ ] Maize tasks work
* [ ] Cassava tasks work
* [ ] Coffee tasks work
* [ ] Planting tasks work
* [ ] Find-water tasks work
* [ ] Water-once tasks work
* [ ] Water-multiple-times tasks work
* [ ] Harvest tasks work
* [ ] Task progress works

## HUD

* [ ] Current task is clearly visible
* [ ] Required amount is visible
* [ ] Progress is visible
* [ ] Timer is visible
* [ ] Score is visible
* [ ] Interaction prompt works
* [ ] Task-complete feedback works

## Game Flow

* [ ] Challenge transitions work
* [ ] Timer works
* [ ] Timeout works
* [ ] Game Over appears
* [ ] Replay exists on Game Over
* [ ] All tasks can be completed
* [ ] Congratulations screen appears
* [ ] Coupon message appears
* [ ] Replay exists on completion
* [ ] Replay creates a fresh game
* [ ] Score resets
* [ ] Tasks regenerate
* [ ] Spawn positions regenerate

## General

* [ ] Desktop browser works
* [ ] Mobile browser is usable later
* [ ] Full game takes approximately 1–2 minutes
* [ ] Required objectives are discoverable
* [ ] No challenge is impossible
* [ ] Several consecutive runs feel different

---

# Definition of Done

A first-time player can:

1. Open FarmQuest.
2. Immediately understand the current task.
3. Control a recognizable low-poly human character.
4. See the character's arms and legs move while running.
5. Explore a compact 3D agricultural environment.
6. Find maize, cassava and/or coffee depending on the generated challenge.
7. Collect one or multiple required seeds.
8. Plant crops when required.
9. Find a dynamically positioned water source.
10. Water crops once or multiple times depending on the task.
11. Harvest the required crops.
12. Earn points.
13. Complete a different combination of tasks on different game sessions.
14. See a clear congratulations message after completing every task.
15. Be told that all tasks are finished and a coupon can now be claimed.
16. See a mock reward.
17. Replay after winning.
18. Replay after losing.
19. Receive new challenges and spawn locations when replaying.
20. Finish a normal game session in approximately 1–2 minutes.

The prototype should look and behave like a small polished low-poly farming game rather than a Three.js technology demonstration.

---

# First Agent Task

Build only the playable browser prototype.

Implement in this order:

```text
Three.js scene

↓

Improved low-poly player
(head + body + arms + legs)

↓

Player movement

↓

Procedural arm/leg running animation

↓

Maize / Cassava / Coffee collectibles

↓

Random spawn manager

↓

Dynamic challenge generator

↓

Clearly visible CURRENT TASK HUD

↓

Seed collection

↓

Planting

↓

Randomized water source

↓

Watering

↓

Harvesting

↓

Timer

↓

Score

↓

Game Over

↓

Congratulations Screen

↓

Coupon Reward Mock

↓

Replay

↓

Regenerate tasks and locations
```

Do not begin with:

```text
React Native

Authentication

Backend

Email

Real QR generation

Production coupon integration
```

First prove that the complete randomized FarmQuest gameplay loop works reliably in the browser.

---

# Agent Implementation Priority

When deciding between additional features and reliability, prioritize:

```text
1. Complete playable game loop
2. Current task clarity
3. Character movement and animation
4. Randomized tasks
5. Randomized locations
6. Agriculture learning flow
7. Visual polish
8. Extra effects
```

Do not add additional systems until the full gameplay loop can be completed successfully several times in succession.
