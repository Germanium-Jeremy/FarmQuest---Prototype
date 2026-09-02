# AGENTS.md — Member 2: Frontend Client, UI Screens, Character/Map Selection, Admin Display

## Identity

You are **Member 2** of a 3-person team building the FarmQuest event edition.

Your scope covers everything the user sees and interacts with in the browser:

- Login/registration screen
- Character selection screen
- Map selection screen
- Lobby/waiting screen
- Admin large-screen display
- In-game HUD updates
- Leaderboard display
- Game over and completion screens
- WebSocket client integration
- Responsive layout for both player browsers and admin screen

---

## Context

The existing codebase is a Three.js browser game with HTML/CSS UI overlays managed by `src/ui/HUD.ts`.

**What already exists:**

- `src/main.ts` — game entry point, creates Game instance, runs animation loop
- `src/game/Game.ts` — main game orchestrator (scene, camera, player, world, challenges, scoring)
- `src/ui/HUD.ts` — all UI screens (registration, HUD, task cards, game over, completion)
- `src/api/FarmQuestApi.ts` — REST API client with `registerPlayer()`, `startNewSession()`, `completeLevel()`, `completeGame()`
- `src/player/Player.ts` — procedural low-poly character (head, body, arms, legs, hat)
- `src/player/PlayerController.ts` — keyboard input handling
- `src/game/GameState.ts` — `MENU | PLAYING | GAME_OVER | COMPLETE` enum
- `src/game/ChallengeManager.ts` — task progression and timing
- `src/game/ScoreManager.ts` — score tracking
- `src/game/LevelManager.ts` — level progression (currently 3 levels)
- `index.html` — single canvas + UI overlay div

**What must change:**

The current flow is: Register → Play 3 Levels → Game Complete → Coupon.

The new flow is: Login/Register → Character Select → Map Select → Wait in Lobby → (Admin Starts) → Play One Instance → Leaderboard → Top 10 Get QR Coupons.

There is also a separate admin display page that shows entering users and the live leaderboard.

---

## Core Responsibilities

### 1. Login/Registration Screen

**Goal:** Replace the current registration form with a proper login/register screen.

**Current implementation:** `HUD.showRegistration()` in `src/ui/HUD.ts`

**New behavior:**

- Screen shows "FarmQuest" title and event branding
- Two modes: "Login" and "Register" (toggle between them)
- **Register mode:** Email + Display Name + "Create Account" button
- **Login mode:** Email + "Login" button (if email exists, log in; if not, show "Account not found. Please register.")
- After successful auth, store `playerId`, `sessionId`, `displayName` in memory
- Transition to character selection screen

**API calls:**

```ts
// Register
POST /api/players/register
Body: { email: string, displayName: string }
Response: { playerId: string, sessionId: string }

// Login (reuse register endpoint — it upserts)
POST /api/players/register
Body: { email: string }
Response: { playerId: string, sessionId: string }
```

**Files to modify:**
```
src/ui/HUD.ts                    — replace showRegistration() with showLogin()
src/api/FarmQuestApi.ts          — add login method or adjust register
src/game/Game.ts                 — update registration flow
```

**Files to create:**
```
src/ui/screens/LoginScreen.ts    — login/register UI (new file for cleaner separation)
```

---

### 2. Character Selection Screen

**Goal:** Let the player choose between male, female, and robot characters.

**Screen layout:**

```
┌──────────────────────────────────────────┐
│         CHOOSE YOUR CHARACTER            │
│                                          │
│   ┌──────┐   ┌──────┐   ┌──────┐       │
│   │  👨  │   │  👩  │   │  🤖  │       │
│   │ MALE │   │FEMALE│   │ROBOT │       │
│   └──────┘   └──────┘   └──────┘       │
│                                          │
│         [ SELECT CHARACTER ]             │
└──────────────────────────────────────────┘
```

**Character data:**

```ts
type CharacterType = 'male' | 'female' | 'robot';

interface CharacterOption {
  type: CharacterType;
  label: string;
  icon: string;          // emoji for preview
  bodyColor: number;     // Three.js hex color
  skinColor: number;
  accentColor: number;
}
```

**Visual differences (for the 3D model — Member 3 handles this):**

| Character | Body Color | Skin | Hat/Head | Accent |
|-----------|-----------|------|----------|--------|
| Male      | Blue `0x4a90d9` | `0xf5cba7` | Straw hat | Brown |
| Female    | Purple `0x9b59b6` | `0xf0c8a0` | Hair bun | Pink |
| Robot     | Silver `0x95a5a6` | `0xbdc3c7` | Antenna | Cyan glow |

**The selection is stored and sent to the server via WebSocket `join_lobby` message.**

**Files to create:**
```
src/ui/screens/CharacterSelectScreen.ts
```

**Files to modify:**
```
src/game/Game.ts          — add character selection state
src/game/GameState.ts     — add CHARACTER_SELECT state
```

---

### 3. Map Selection Screen

**Goal:** Let the player choose between three themed maps.

**Screen layout:**

```
┌──────────────────────────────────────────┐
│           SELECT YOUR MAP                │
│                                          │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐│
│   │  🌧️     │ │  🏜️     │ │  🌊     ││
│   │ RWANDA   │ │ SUDAN    │ │SEYCHELLES││
│   │ Wet Land │ │ Desert   │ │Water Land││
│   └──────────┘ └──────────┘ └──────────┘│
│                                          │
│         [ SELECT MAP ]                   │
└──────────────────────────────────────────┘
```

**Map data:**

```ts
type MapId = 'rwanda' | 'sudan' | 'seychelles';

interface MapOption {
  id: MapId;
  name: string;
  description: string;
  icon: string;
  groundColor: number;
  skyColor: number;
  treeColor: number;
  waterColor: number;
}
```

**Map themes:**

| Map | Ground | Sky | Trees | Water | Feel |
|-----|--------|-----|-------|-------|------|
| Rwanda | Lush green `0x7ec850` | Blue `0x8fd3ff` | Deep green `0x228B22` | Blue `0x3498db` | Green farmland |
| Sudan | Sandy `0xd4b896` | Pale yellow `0xf0e68c` | Dry brown `0x8B7355` | Sparse blue | Arid desert |
| Seychelles | Beach sand `0xf4e1c1` | Ocean blue `0x87ceeb` | Palm green `0x2ecc71` | Turquoise `0x1abc9c` | Tropical island |

**The map selection changes:**

1. World terrain colors (Member 3 handles the 3D changes)
2. The background sky color (set in Game.ts renderer)
3. The spawn configuration (Member 3 handles map-specific spawns)

**The selection is sent to the server via WebSocket `join_lobby` message.**

**Files to create:**
```
src/ui/screens/MapSelectScreen.ts
```

**Files to modify:**
```
src/game/Game.ts          — add map selection state
src/game/GameState.ts     — add MAP_SELECT state
```

---

### 4. Lobby/Waiting Screen

**Goal:** Show the player they are waiting for the admin to start the game.

**Screen layout:**

```
┌──────────────────────────────────────────┐
│          ⏳ WAITING TO START            │
│                                          │
│  Connected Players: 47                   │
│                                          │
│  Your Character: 👨 Male                 │
│  Your Map: 🌧️ Rwanda                    │
│                                          │
│  The game will start when the admin      │
│  begins the session.                     │
│                                          │
│  Stay ready!                             │
└──────────────────────────────────────────┘
```

**WebSocket events handled:**

- `lobby_update` → update player count
- `game_start` → transition to PLAYING state with the received task sequence

**Files to create:**
```
src/ui/screens/LobbyScreen.ts
```

---

### 5. Admin Large-Screen Display

**Goal:** A separate page (`/admin`) that displays on the projected large screen.

**This is a completely separate HTML page, NOT part of the game canvas.**

**Admin page URL:** `http://domain/admin`

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│                    🌾 FARMQUEST                            │
│                    EVENT DASHBOARD                         │
│                                                            │
│  ┌─────────────────────────┐  ┌────────────────────────┐  │
│  │   ENTERING PLAYERS      │  │   LEADERBOARD          │  │
│  │                         │  │                        │  │
│  │   👨 Jean - Rwanda      │  │   1. 👨 Jean   - 850   │  │
│  │   👩 Alice - Sudan      │  │   2. 👩 Alice  - 820   │  │
│  │   🤖 Bot42 - Seychelles │  │   3. 🤖 Bot42  - 780   │  │
│  │   👨 Pierre - Rwanda    │  │   4. 👨 Pierre - 760   │  │
│  │   ...                   │  │   ...                  │  │
│  │                         │  │                        │  │
│  │   Total: 47 players     │  │   Time: 01:23          │  │
│  └─────────────────────────┘  └────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              [ 🎮 START GAME ]                       │  │
│  │              [ ⏹️ END GAME ]                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Map: Rwanda (Wet Land)   Status: WAITING                  │
└────────────────────────────────────────────────────────────┘
```

**Features:**

- Left panel: scrolling list of players entering the lobby (with their character icon and map)
- Right panel: live leaderboard (updates as players complete)
- Bottom: Start/End game buttons
- Status bar: current map, game status, elapsed time
- Auto-scrolls the player list as new players join
- The leaderboard updates in real-time as players finish

**Implementation:**

This is a standalone HTML page with vanilla JavaScript (no Three.js needed). It connects to the same WebSocket server with `?admin=true` query parameter.

**Files to create:**
```
server/src/routes/adminPage.ts         — serves admin HTML
server/public/admin/index.html         — admin dashboard HTML/CSS/JS
```

Or alternatively, create it as a client-side page:

```
src/admin/admin.html                   — admin page
src/admin/admin.ts                     — admin WebSocket client + UI logic
```

**Admin authentication:**

- Admin enters a simple password/token on the admin page
- This token is sent with WebSocket connection and REST calls
- Token is defined in environment variables on the server

**Files to create:**
```
src/admin/admin.html
src/admin/admin.ts
src/admin/admin.css
```

---

### 6. WebSocket Client

**Goal:** Connect to the server's WebSocket and handle all real-time messages.

**Files to create:**
```
src/api/GameSocket.ts    — WebSocket client wrapper
```

**Implementation:**

```ts
class GameSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, (data: any) => void> = new Map();

  connect(sessionId: string): void {
    const url = `ws://${window.location.host}/ws?sessionId=${sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handler = this.handlers.get(message.type);
      handler?.(message);
    };

    this.ws.onclose = () => { /* handle disconnect */ };
    this.ws.onerror = (err) => { /* handle error */ };
  }

  on(type: string, handler: (data: any) => void): void {
    this.handlers.set(type, handler);
  }

  send(message: object): void {
    this.ws?.send(JSON.stringify(message));
  }

  joinLobby(playerId: string, displayName: string, characterType: string, mapId: string): void {
    this.send({ type: 'join_lobby', playerId, displayName, characterType, mapId });
  }

  playerReady(): void {
    this.send({ type: 'player_ready' });
  }

  gameComplete(score: number, completionTime: number): void {
    this.send({ type: 'game_complete', score, completionTime });
  }

  disconnect(): void {
    this.ws?.close();
  }
}
```

**Files to modify:**
```
src/game/Game.ts          — integrate GameSocket
src/api/FarmQuestApi.ts   — no changes needed (REST still used for auth)
```

---

### 7. Updated Game Flow

**New game flow in `Game.ts`:**

```ts
// States
enum GameState {
  MENU,              // shown initially
  LOGIN,             // login/register screen
  CHARACTER_SELECT,  // choose character
  MAP_SELECT,        // choose map
  LOBBY,             // waiting for admin
  PLAYING,           // game in progress
  GAME_OVER,         // timed out
  COMPLETE,          // all tasks done
  LEADERBOARD,       // show final results
}
```

**Flow:**

```
MENU → LOGIN → CHARACTER_SELECT → MAP_SELECT → LOBBY → PLAYING → COMPLETE/GameOver → LEADERBOARD
```

**Key changes to `Game.ts`:**

1. Remove the old 3-level system (`LevelManager` is replaced by instance-based play)
2. Remove `startLevel()` — replace with `startGame(tasks)` that receives tasks from server
3. Add WebSocket integration for lobby and game events
4. On `game_complete` from server: transition to LEADERBOARD screen
5. On `game_start` from server: start playing with the received task sequence

**Files to modify:**
```
src/game/Game.ts          — major refactor of game flow
src/game/GameState.ts     — add new states
src/game/LevelManager.ts  — may be removed or simplified
```

---

### 8. Updated HUD

**Goal:** The HUD must work for single-instance play (no level progression indicators).

**Changes to `src/ui/HUD.ts`:**

- Remove "Level X of 3" from the HUD
- Remove level progress dots
- Show task number instead (e.g., "Task 3 of 5")
- Add player count indicator during lobby
- Add elapsed time during gameplay

**New HUD elements:**

```
┌─────────────────────────────────────┐
│ CURRENT TASK                        │
│ 🌽 FIND 3 MAIZE SEEDS              │
│                                     │
│ PROGRESS: 2 / 3                     │
│ TASK: 3 / 5                         │
│ TIME: 00:18                         │
│ ⭐ SCORE: 250                       │
│ PLAYERS: 47 connected               │
└─────────────────────────────────────┘
```

**Files to modify:**
```
src/ui/HUD.ts              — update task display, remove level indicators
```

---

### 9. Leaderboard Display Screen

**Goal:** Show the final results after the game finishes.

**Screen layout:**

```
┌──────────────────────────────────────────┐
│        🏆 LEADERBOARD                   │
│                                          │
│  🥇 1. Jean        - 850 pts  (1:23)   │
│  🥈 2. Alice       - 820 pts  (1:28)   │
│  🥉 3. Bot42       - 780 pts  (1:35)   │
│     4. Pierre      - 760 pts  (1:41)   │
│     5. Marie       - 740 pts  (1:45)   │
│     ...                                 │
│                                          │
│  YOUR RANK: #7                           │
│  YOUR SCORE: 680 pts                     │
│                                          │
│  🎉 Top 10 players receive rewards!     │
│     Check your email for your QR code.   │
│                                          │
│         [ PLAY AGAIN ]                   │
└──────────────────────────────────────────┘
```

**For top-10 players, show:**

```
┌──────────────────────────────────────────┐
│     🎉 CONGRATULATIONS!                 │
│                                          │
│     You finished in the TOP 10!         │
│                                          │
│     Your Rank: #3                        │
│     Your Reward: Coffee Shop Gift Card   │
│                                          │
│     A QR code coupon has been sent       │
│     to your email.                       │
│                                          │
│     Present it at any participating      │
│     location to claim your reward!       │
│                                          │
│         [ PLAY AGAIN ]                   │
└──────────────────────────────────────────┘
```

**Files to create:**
```
src/ui/screens/LeaderboardScreen.ts
```

---

### 10. Screen Architecture

**Goal:** Organize screens cleanly instead of putting everything in one `HUD.ts` file.

**Current structure:** Everything is in `src/ui/HUD.ts` (a single 400+ line file)

**New structure:**

```
src/ui/
├── HUD.ts                    — main HUD controller (task bar, prompts, feedback)
├── screens/
│   ├── LoginScreen.ts        — login/register
│   ├── CharacterSelectScreen.ts
│   ├── MapSelectScreen.ts
│   ├── LobbyScreen.ts
│   ├── LeaderboardScreen.ts
│   ├── GameOverScreen.ts     — timeout/game over
│   └── CompleteScreen.ts     — game complete
└── components/
    └── Button.ts             — reusable styled button component
```

Each screen class follows this pattern:

```ts
class SomeScreen {
  private container: HTMLElement;

  constructor(private overlay: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = '...';
    this.overlay.appendChild(this.container);
  }

  show(data: { /* screen-specific data */ }, callbacks: { /* button handlers */ }): void {
    this.container.style.display = 'flex';
    this.container.innerHTML = `...`;
    // attach event listeners
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    this.container.remove();
  }
}
```

**Files to create:**
```
src/ui/screens/LoginScreen.ts
src/ui/screens/CharacterSelectScreen.ts
src/ui/screens/MapSelectScreen.ts
src/ui/screens/LobbyScreen.ts
src/ui/screens/LeaderboardScreen.ts
src/ui/screens/GameOverScreen.ts
src/ui/screens/CompleteScreen.ts
src/ui/components/Button.ts
```

**Files to modify:**
```
src/ui/HUD.ts    — simplify, delegate to screen classes
```

---

### 11. Styling Guidelines

**Keep the existing visual style:**

- Dark green/gold color scheme
- Rounded corners
- Bold typography
- Gradient backgrounds
- Emoji as icons

**Color palette:**

```css
--bg-dark: #142b1b
--bg-card: rgba(20, 43, 27, 0.94)
--accent-green: #52a447
--accent-gold: #ffe36d
--accent-lime: #bff28a
--text-white: #ffffff
--text-dark: #193620
--card-bg: linear-gradient(145deg, #fdf8df, #ecd17a)
--danger: #e5534b
--warning: #e7a53b
```

**Mobile responsiveness:**

- Use `clamp()` for font sizes
- Use `min(92vw, 600px)` for card widths
- Stack elements vertically on narrow screens
- Touch-friendly button sizes (min 44px tap target)

---

### 12. Admin Page Styling

**The admin page has a different style:**

- Dark background `#0a0a1a`
- Neon green accents `#00ff88`
- Monospace fonts for data
- Large, readable text for projection
- Split layout: players left, leaderboard right

**The admin page must be readable from 10+ meters away on a projected screen.**

Font sizes should be large:
- Title: 48px+
- Player names: 24px+
- Leaderboard entries: 28px+
- Buttons: 32px+

---

### 13. Integration Points

**What you need from Member 1 (Backend):**

- REST API endpoints and request/response formats
- WebSocket message protocol (all message types)
- Session token format
- Admin authentication method
- The task sequence format (so you can display task info correctly)

**What you need from Member 3 (Game Engine):**

- Character model variants (male, female, robot) — you need to know the character types to display selection
- Map visual configurations — you need to know what map IDs and themes exist
- How the game receives task sequence from the server (integration point)

**What they need from you:**

- The UI screens and screen transitions
- The Game.ts state machine changes
- The WebSocket client implementation
- The admin page HTML/CSS

---

### 14. Files Summary

**Files to create:**

```
src/ui/screens/LoginScreen.ts
src/ui/screens/CharacterSelectScreen.ts
src/ui/screens/MapSelectScreen.ts
src/ui/screens/LobbyScreen.ts
src/ui/screens/LeaderboardScreen.ts
src/ui/screens/GameOverScreen.ts
src/ui/screens/CompleteScreen.ts
src/ui/components/Button.ts
src/api/GameSocket.ts
src/admin/admin.html
src/admin/admin.ts
src/admin/admin.css
```

**Files to modify:**

```
src/main.ts                    — add screen flow management
src/game/Game.ts               — major refactor (new states, WebSocket, remove levels)
src/game/GameState.ts          — add new states
src/ui/HUD.ts                  — simplify, delegate to screens
src/api/FarmQuestApi.ts        — may need minor adjustments
index.html                     — add admin page script if needed
```

**Files to potentially remove or deprecate:**

```
src/game/LevelManager.ts       — replaced by instance-based play
```

---

### 15. Priority Order

Implement in this exact order:

1. Create the screen component architecture (base class, container pattern)
2. Build LoginScreen (login + register modes)
3. Build CharacterSelectScreen
4. Build MapSelectScreen
5. Build LobbyScreen with player count display
6. Create GameSocket WebSocket client
7. Refactor Game.ts state machine to use new screens
8. Update HUD to show task count instead of level indicators
9. Build LeaderboardScreen
10. Build GameOverScreen (timeout)
11. Build CompleteScreen (game complete, reward info)
12. Build Admin dashboard page
13. Connect everything together end-to-end
14. Test on multiple browser windows simultaneously

---

### 16. Testing Checklist

- [ ] Login screen renders correctly
- [ ] Registration creates account and advances to character select
- [ ] Login with existing account works
- [ ] Login with non-existent email shows error
- [ ] Character selection shows 3 options
- [ ] Selected character is highlighted
- [ ] Map selection shows 3 options
- [ ] Selected map is highlighted
- [ ] Lobby screen shows player count
- [ ] Player count updates as other players join
- [ ] Game starts when admin clicks start
- [ ] HUD shows current task clearly
- [ ] HUD shows task progress
- [ ] HUD shows timer
- [ ] HUD shows score
- [ ] Task transitions work correctly
- [ ] Game over screen appears on timeout
- [ ] Complete screen appears when all tasks done
- [ ] Leaderboard shows rankings
- [ ] Top 10 indicator is visible
- [ ] Play Again button works
- [ ] Admin page loads at /admin
- [ ] Admin page shows entering players in real-time
- [ ] Admin page shows leaderboard updates
- [ ] Admin can start a game
- [ ] Admin can end a game
- [ ] Layout is readable on large projected screen
- [ ] Player browser layout works on mobile
- [ ] All screens transition smoothly

---

### 17. Definition of Done

Member 2 is done when:

1. A player can register, log in, select a character, select a map, wait in lobby, play the game, and see the leaderboard
2. The admin page displays entering players in real-time on a large screen
3. The admin can start and end games from the admin page
4. The game HUD clearly shows the current task, progress, timer, and score
5. All screen transitions are smooth and visually polished
6. The layout works on both desktop browsers (players) and large projected screens (admin)
7. The WebSocket client connects, receives messages, and updates the UI accordingly
8. The leaderboard correctly ranks players by completion time
9. Top-10 players see a congratulatory message with reward information
10. The visual style is consistent with the existing FarmQuest branding
