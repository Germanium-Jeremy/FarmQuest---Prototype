# AGENTS.md — FarmQuest Three.js Prototype

## Mission
Build a **1–2 minute FarmQuest web game prototype** using Three.js.

Core loop:
**Explore → Find seed → Find water → Harvest → Score → Reward**

FarmQuest is a stylized low-poly 3D agriculture game presented through an elevated/2.5D camera. The prototype should prioritize speed, clarity and visual quality over feature count.

## Technology
Recommended:
- TypeScript
- Vite
- Three.js
- HTML/CSS
- GLB/GLTF assets
- Three.js GLTFLoader
- Three.js animation system when animated models exist

React may be added later if it does not complicate the prototype.

Do not use Pygame. Do not recreate the world as fake 2D sprites.

## Visual Direction
Target a Township-like stylized farming world:
- Low-poly models
- Elevated camera
- Slight downward angle
- Orthographic camera preferred initially
- Bright readable environment
- Simple shadows
- Clear paths and landmarks

Example:
```text
          FOREST
      🌳 🌳 🌳 🌳
           ☕
           │
       ── ROAD ──

      🌽 FARM    💧 WATER

        🏠 NPC

          👤
        PLAYER
```

The world is fully 3D.

## Core Game Flow
The complete experience should normally take 60–120 seconds.

START
 ↓
FIND SEED
 ↓
FIND WATER
 ↓
HARVEST
 ↓
FINAL SCORE
 ↓
REWARD

Timeout:
TIME OUT → GAME OVER → RETRY

## Challenge 1 — Find Seed
HUD:
- TASK: FIND SEEDS
- TIME: 00:30
- SCORE: 0

NPC route:
- Receive maize/cassava
- +100 points

Forest route:
- Discover rare coffee
- +200 points

Coffee should be optional unless explicitly required.

Use:
- Small 3D model
- Floating icon
- Glow
- Particle effect if useful

Do not hide required objects excessively.

## Challenge 2 — Find Water
After seed:
- TASK: FIND WATER
- TIME: 00:20

Use an obvious well, river, tank or pump.
Suggested reward: +100.

## Challenge 3 — Harvest
After water:
- TASK: HARVEST YOUR CROP
- TIME: 00:30

Do not implement realistic waiting. Make the crop immediately or quickly harvestable.

Suggested reward: +150.

## Architecture
Keep architecture small.

Suggested structure:
```text
src/
├── main.ts
├── game/
│   ├── Game.ts
│   ├── GameState.ts
│   ├── ChallengeManager.ts
│   └── ScoreManager.ts
├── player/
│   ├── Player.ts
│   └── PlayerController.ts
├── world/
│   ├── World.ts
│   ├── Interactable.ts
│   ├── NPC.ts
│   ├── Seed.ts
│   ├── WaterSource.ts
│   └── Crop.ts
├── ui/
│   └── HUD.ts
└── assets/
```

Avoid excessive abstraction.

## Game State
Use simple states:
- MENU
- PLAYING
- GAME_OVER
- COMPLETE

Challenges:
- FIND_SEED
- FIND_WATER
- HARVEST

ChallengeManager owns:
- Current challenge
- Timer
- Completion
- Transition
- Timeout

## Three.js Scene
Scene should contain:
- Terrain
- Roads
- Farm
- Forest
- Water
- Buildings
- NPC
- Player
- Crops
- Lighting

Use reusable asset-loading functions/classes.

Do not duplicate model-loading logic.

## Camera
Start with an OrthographicCamera positioned above and diagonally away from the player.

Camera should:
- Keep player visible
- Show nearby objectives
- Avoid excessive empty space
- Avoid clipping through buildings
- Preserve the 2.5D appearance

Agent establishes initial values; human makes final visual judgment.

## Player
Implement:
- Keyboard movement
- Simple collision/world boundaries
- Facing direction
- Interaction range
- Camera follow

Controls:
- WASD / Arrow Keys: Move
- E / Space: Interact

Keep it simple.

## Character Animation
If a correctly rigged animated GLB exists, use:
- Idle
- Walk
- Run
- Interaction animation if available

Use Three.js animation mixers for skeletal animation.

If rigging is not ready:
- Use a static character
- Or simple movement

Do not block the prototype on character rigging.

## Interaction System
Use a reusable interaction pattern.

Concept:
```ts
interface Interactable {
    interact(): void;
}
```

Examples:
- NPC → give seed
- Seed → collect
- Well → complete water challenge
- Crop → harvest

A simple distance check is sufficient initially.

## UI
Use HTML/CSS over the Three.js canvas unless there is a strong reason to render UI in 3D.

Show:
- Task
- Timer
- Score
- Interaction prompt
- Completion feedback

Example:
```text
┌──────────────────────────────────────┐
│ 🌱 FIND SEEDS          TIME: 00:24  │
│ ⭐ SCORE: 0                          │
└──────────────────────────────────────┘
```

Use large readable text for event players.

## World Design
Keep the map small. Every required objective should be reachable quickly.

Do not create a large open world.

## Assets
Prefer GLB/GLTF.

Flow:
Asset/Blender → GLB → GLTFLoader → Three.js scene

Agent can:
- Write loaders
- Position models
- Configure transforms
- Configure animation playback
- Create placeholders

Human chooses:
- Final assets
- Visual scale
- Materials
- Map composition
- Camera composition

## Reusing Existing Unity Map
A Unity scene cannot simply be opened by Three.js.

Instead:
Unity/Blender assets → Export GLB/GLTF → Recreate the small scene layout in Three.js.

Use the Unity scene as a visual reference when useful. Do not recreate unnecessary Unity systems.

## Human Responsibilities
Human handles visual judgment:
- Asset selection
- Scene composition
- Camera tuning
- Lighting
- Shadows
- Model scale
- Materials
- Browser playtesting
- Mobile testing

Human should verify:
- Player movement
- Collision
- Floating/intersecting objects
- Camera
- Readability
- Performance
- 1–2 minute completion time

## Agent Responsibilities
Agent implements:
- Three.js scene setup
- Asset loading
- Player movement
- Camera behavior
- Interaction
- ChallengeManager
- Timer
- Score
- Seed
- Water
- Crop
- UI
- Game over
- Completion
- Reward mock
- API client after local gameplay works

## Human + Agent Workflow
1. Human prepares/selects assets.
2. Agent creates Vite + Three.js project and scene.
3. Human judges camera, scale, lighting and composition.
4. Agent implements player and interactions.
5. Human plays the complete loop.
6. Human reports visual/runtime problems.
7. Agent fixes them.
8. Human retests.

Repeat until event-ready.

## Development Phases
### Phase 1
Basic 3D world.

### Phase 2
Player exploration.

### Phase 3
Seed challenge under 30 seconds.

### Phase 4
Water challenge under 20 seconds.

### Phase 5
Harvest challenge under 30 seconds.

### Phase 6
Score/result/reward mock.

### Phase 7
Mobile touch controls and responsive UI.

### Phase 8
Backend integration.

## Reward Prototype
Use a mock initially:
```text
CHALLENGE COMPLETE!

SCORE: 450

🎁 REWARD

FREE COFFEE ☕

[ SHOW QR ]
```

Do not integrate real email before gameplay is stable.

## Backend Security
Never put secrets in browser code.

Never include:
- Database passwords
- Private API keys
- Email credentials
- JWT signing secrets
- Admin credentials

The browser sends game results; the backend makes reward decisions.

## Performance
Prefer:
- Low-poly models
- GLB
- Small/compressed textures
- Limited dynamic lights
- Simple collision
- Small scene
- Limited particles

Optimize for reliable event performance and quick loading.

## Web Distribution
Eventually target:
QR code → FarmQuest URL → game loads → play → score → reward

The prototype should be deployable as a static web application.

## Do Not Build Yet
- Multiplayer
- Large open world
- Complex farming economy
- Crafting
- Large inventory
- Character customization
- Advanced NPC AI
- Realistic crop growth
- Complex physics
- Production authentication
- Real coupon/email infrastructure

## Testing Checklist
- [ ] Browser loads
- [ ] 3D scene loads
- [ ] Player appears
- [ ] Player moves
- [ ] Camera works
- [ ] Player stays in world
- [ ] NPC interaction works
- [ ] Seed can be collected
- [ ] Coffee seed can be discovered
- [ ] Water interaction works
- [ ] Crop becomes harvestable
- [ ] Crop can be harvested
- [ ] Timer works
- [ ] Score works
- [ ] Challenge transitions work
- [ ] Timeout works
- [ ] Game Over works
- [ ] Retry works
- [ ] Reward screen works
- [ ] Desktop works
- [ ] Mobile browser is usable
- [ ] Full game takes 1–2 minutes

## Definition of Done
A first-time player can:
1. Open the game.
2. Understand the task immediately.
3. Explore a small 3D agricultural world.
4. Find a normal or rare seed.
5. Find water.
6. Harvest a crop.
7. Earn points.
8. See a reward.
9. Finish in approximately 1–2 minutes.

The prototype should look like a small polished low-poly farming game, not a Three.js technology demonstration.

## First Agent Task
Build only:
```text
Three.js scene
 ↓
Player
 ↓
NPC / Seed
 ↓
30-second timer
 ↓
Seed found
 ↓
Water source
 ↓
20-second timer
 ↓
Water found
 ↓
Crop
 ↓
30-second timer
 ↓
Harvest
 ↓
Score
 ↓
Reward mock
```

Do not begin with React Native, authentication, backend, email or real QR generation. First prove the complete 1–2 minute game loop in the browser.
