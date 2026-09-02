# AGENTS.md — Member 1: Backend, Infrastructure, Auth, Real-Time Events, QR/Coupon System

## Identity

You are **Member 1** of a 3-person team building the FarmQuest event edition.

Your scope covers everything behind the game canvas:

- Server architecture
- Database schema
- User authentication
- WebSocket real-time communication
- Admin event control
- QR code generation
- Coupon validation and redemption
- Email delivery
- Load handling for 20–300 concurrent users
- Vendor/reward portal API

---

## Context

The existing codebase is a Three.js browser game with an Express/SQLite backend.

**What already exists:**

- `server/src/server.ts` — Express server with CORS, rate limiting, health check
- `server/src/storage/database.ts` — SQLite via `node:sqlite` with players, game_sessions, level_results, coupons tables
- `server/src/routes/players.ts` — Register and create session endpoints
- `server/src/routes/gameResults.ts` — Level complete and game complete endpoints
- `server/src/services/CouponService.ts` — Generates `FQ-XXXXXX` coupon codes
- `server/src/services/EmailService.ts` — Dev (console log) and SMTP email services
- `server/src/validation/schemas.ts` — Zod schemas for request validation
- `server/src/types/index.ts` — Row types for players, sessions, coupons
- `server/src/config/env.ts` — Environment loader
- `server/.env.example` — Environment variable template

**What must change:**

The current system is single-player, session-per-player, no real-time communication. The event edition requires real-time coordination: an admin starts the game for all connected players simultaneously, and players who finish in the top 10 get QR-code coupons emailed to them. A separate vendor portal must validate and redeem those QR codes.

---

## Core Responsibilities

### 1. Server Infrastructure

**Goal:** Handle 20–300 concurrent WebSocket connections alongside REST API traffic.

**What to do:**

- Add `ws` (WebSocket library) to `server/package.json` dependencies
- Upgrade `server/src/server.ts` to create an HTTP server from Express and attach a WebSocket server on the same port
- Implement connection tracking: maintain a `Map<string, PlayerConnection>` keyed by session ID
- Implement heartbeat/ping to detect stale connections and clean them up
- Add graceful shutdown handling (SIGTERM/SIGINT)
- Add structured logging (at minimum, log connection events, game events, errors)

**Load considerations:**

- SQLite is fine for this scale (20–300 users)
- WebSocket messages are lightweight JSON
- No external database service needed for a one-day event
- If the server is a single machine behind a domain, nginx or similar reverse proxy handles TLS termination — that is deployment, not your code

**Files to modify:**
```
server/package.json          — add "ws" dependency
server/src/server.ts         — HTTP + WebSocket server
server/src/types/index.ts    — add new types
```

**Files to create:**
```
server/src/ws/SocketManager.ts      — WebSocket connection management
server/src/ws/EventHandler.ts       — Message routing and game event handling
server/src/ws/GameCoordinator.ts    — Admin start signal, game state sync
```

---

### 2. Database Schema Extensions

**Goal:** Support the new event flow (character, map, leaderboard, vendor portal).

**Current tables:**

```sql
players (id, email, display_name, created_at)
game_sessions (id, player_id, started_at, completed_at, status, total_score, highest_level)
level_results (id, session_id, level_number, score, completed, completed_at)
coupons (id, player_id, session_id, code, reward_type, status, created_at, sent_at, redeemed_at)
```

**New tables needed:**

```sql
-- Event instances: one per admin-started game round
CREATE TABLE IF NOT EXISTS event_instances (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL,          -- 'rwanda' | 'sudan' | 'seychelles'
  status TEXT NOT NULL,          -- 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
  created_by TEXT,               -- admin session id (optional)
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL
);

-- Player choices per instance
CREATE TABLE IF NOT EXISTS instance_players (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  character_type TEXT NOT NULL,  -- 'male' | 'female' | 'robot'
  map_id TEXT NOT NULL,
  status TEXT NOT NULL,          -- 'REGISTERED' | 'PLAYING' | 'COMPLETED' | 'TIMEOUT'
  score INTEGER DEFAULT 0,
  completion_time REAL,          -- seconds from game start to completion
  completed_at TEXT,
  FOREIGN KEY (instance_id) REFERENCES event_instances(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (session_id) REFERENCES game_sessions(id),
  UNIQUE(instance_id, player_id)
);

-- Leaderboard entries for top 10 per instance
CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  completion_time REAL,
  reward_type TEXT,
  coupon_id TEXT,
  FOREIGN KEY (instance_id) REFERENCES event_instances(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Vendor accounts (manually created by programmer)
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,   -- bcrypt hash
  location_name TEXT NOT NULL,   -- 'Simba Supermarket', 'Cafe', etc.
  created_at TEXT NOT NULL
);

-- Vendor sessions (simple token-based)
CREATE TABLE IF NOT EXISTS vendor_sessions (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);
```

**Files to modify:**
```
server/src/storage/database.ts  — add new tables, add new query functions
server/src/types/index.ts       — add new row types
```

**Important notes:**

- Keep the existing tables. Extend, do not replace.
- Add migration logic that runs on startup (CREATE TABLE IF NOT EXISTS is fine for this event).
- Add helper functions: `createInstance()`, `registerPlayerForInstance()`, `updateInstancePlayerStatus()`, `getLeaderboard()`, `getCouponByCode()`, `redeemCoupon()`, `createVendor()`, `authenticateVendor()`, `createVendorSession()`, `getVendorByToken()`.

---

### 3. User Authentication

**Goal:** Email + username registration/login. Session-based auth for game clients. Token-based auth for vendor portal.

**Player flow:**

1. Player opens URL → sees registration/login screen
2. Player enters email + display name
3. Backend checks if email exists:
   - If exists → return existing player info (login)
   - If new → create player (register)
4. Backend creates a session, returns `{ playerId, sessionId, displayName }`
5. Client stores `sessionId` in memory (not localStorage for this event)

**Implementation details:**

- Reuse existing `upsertPlayer()` — it already handles login-or-register via email
- The existing `/api/players/register` endpoint already does this. Verify it returns `displayName` in the response.
- Add a `/api/players/me` endpoint that returns player info given a session ID (for session resumption)
- Add a `/api/players/login` endpoint that is functionally identical to register (since we use email as the identifier)

**Vendor flow:**

1. Vendor navigates to `/vendor` portal URL
2. Enters username + password
3. Backend authenticates against `vendors` table
4. Returns a session token
5. Token is sent with every subsequent request

**Files to modify:**
```
server/src/routes/players.ts        — add login endpoint, return displayName
server/src/validation/schemas.ts    — add login schema
```

**Files to create:**
```
server/src/routes/vendors.ts        — vendor auth + coupon validation endpoints
server/src/services/AuthService.ts  — session token generation (use crypto.randomBytes)
server/src/middleware/vendorAuth.ts — middleware to verify vendor token
```

**Security notes:**

- Use `crypto.randomBytes(32).toString('hex')` for session tokens
- Store vendor passwords as bcrypt hashes (add `bcryptjs` dependency)
- Vendor tokens expire after 24 hours
- Never expose password hashes or tokens in responses
- Rate limit vendor auth endpoint (reuse existing rate limiter pattern)

---

### 4. WebSocket Real-Time Communication

**Goal:** Coordinate game start across all connected players. Broadcast leaderboard updates. Display entering users on admin screen.

**Message protocol:**

```ts
// Client → Server
type ClientMessage =
  | { type: 'join_lobby', playerId: string, sessionId: string, displayName: string, characterType: string, mapId: string }
  | { type: 'player_ready', playerId: string }
  | { type: 'game_complete', playerId: string, score: number, completionTime: number }

// Server → Client
type ServerMessage =
  | { type: 'lobby_update', players: LobbyPlayer[], count: number }
  | { type: 'game_start', instanceId: string, tasks: GameTask[] }
  | { type: 'player_completed', displayName: string, rank: number, score: number }
  | { type: 'game_finished', leaderboard: LeaderboardEntry[], yourRank: number }
  | { type: 'error', message: string }

// Admin → Server
type AdminMessage =
  | { type: 'admin_start_game', mapId: string }
  | { type: 'admin_end_game' }

// Server → Admin
type AdminBroadcast =
  | { type: 'lobby_update', players: LobbyPlayer[], count: number }
  | { type: 'player_joined', displayName: string, characterType: string, mapId: string }
  | { type: 'player_left', displayName: string }
  | { type: 'game_started', instanceId: string }
  | { type: 'leaderboard_update', entries: LeaderboardEntry[] }
  | { type: 'game_finished', leaderboard: LeaderboardEntry[] }
```

**WebSocket connection flow:**

1. Client connects to `ws://domain/ws?sessionId=XXX`
2. Server validates session ID against database
3. Client sends `join_lobby` with player info
4. Server adds player to lobby, broadcasts `lobby_update` to all clients AND admin
5. Admin sees players appearing on the large screen
6. Admin clicks "Start Game" → server creates an `event_instances` row, generates random tasks for the instance, broadcasts `game_start` with the task sequence to all registered players
7. Players play the game independently (tasks are client-side, same as current flow)
8. When a player completes all tasks, client sends `game_complete`
9. Server records the completion, calculates rank, broadcasts `player_completed` to admin and other clients
10. When 10 players complete OR the admin ends the game, server broadcasts `game_finished` with the final leaderboard
11. Server generates QR coupons for top 10, sends emails

**Implementation details:**

- Use the `ws` library (not `socket.io` — keep dependencies minimal)
- Maintain player connections in a Map: `Map<string, WebSocket>`
- Maintain lobby state: array of connected players with their info
- Admin connection is distinguished by a query parameter: `?admin=true&adminToken=XXX`
- Broadcast to all connected WebSockets using simple iteration
- Handle disconnections: remove from lobby if not started, mark as TIMEOUT if mid-game
- Heartbeat: send ping every 30 seconds, close connections that do not respond

**Files to create:**
```
server/src/ws/SocketManager.ts      — WebSocket server setup, connection tracking
server/src/ws/EventHandler.ts       — Route messages, update game state
server/src/ws/GameCoordinator.ts    — Lobby management, game start/end logic
server/src/ws/types.ts              — Message type definitions
```

---

### 5. Game Coordinator Logic

**Goal:** Manage the lifecycle of a game instance.

**States:**

```
WAITING    → Admin created instance, players joining lobby
IN_PLAY    → Admin started game, players playing
FINISHED   → Game ended (10 completions or admin stop)
```

**Key logic:**

```ts
class GameCoordinator {
  private currentInstance: Instance | null = null;
  private lobby: Map<string, LobbyPlayer> = new Map();
  private connections: Map<string, WebSocket> = new Map();

  joinLobby(playerId, sessionId, displayName, characterType, mapId): void;
  removeFromLobby(playerId): void;
  startGame(adminToken, mapId): Instance;
  playerComplete(playerId, score, completionTime): void;
  endGame(): void;
  getLeaderboard(): LeaderboardEntry[];
}
```

**Task generation:**

- When the game starts, the coordinator generates a single task sequence for the instance
- All players in that instance get the SAME task sequence (they are competing on the same challenge)
- Use the existing `ChallengeGenerator` pattern but generate once per instance
- Send the task sequence in the `game_start` message so the client does not need to generate

**Top 10 determination:**

- Track completions in order of `completionTime` (time from game start to completion)
- When 10 players complete, auto-finish the game
- If fewer than 10 complete before admin stops, use however many completed
- Rank by: 1) completion time (faster = better), 2) score (higher = better)

**Coupon generation for top 10:**

- After game finishes, for each top-10 player:
  1. Generate a coupon using the existing `CouponService` pattern
  2. Assign different reward types: rank 1 gets best reward, rank 10 gets least
  3. Send email with QR code containing the coupon code
  4. The QR code is simply the coupon code string rendered as a QR image

**Reward types (different for each rank):**

```ts
const REWARD_TYPES = [
  'Grand Prize - Premium Gift Basket',
  '2nd Place - Restaurant Voucher',
  '3rd Place - Coffee Shop Gift Card',
  '4th Place - Grocery Store Coupon',
  '5th Place - Movie Tickets',
  '6th Place - Free Coffee Bundle',
  '7th Place - FarmQuest Merchandise',
  '8th Place - Snack Pack',
  '9th Place - Free Parking Voucher',
  '10th Place - FarmQuest Sticker Pack',
];
```

**Files to create:**
```
server/src/ws/GameCoordinator.ts
server/src/services/RewardService.ts  — reward assignment + QR generation
```

**Files to modify:**
```
server/src/services/CouponService.ts  — add reward-type-specific coupon generation
server/src/services/EmailService.ts   — add QR code HTML in email
```

---

### 6. QR Code System

**Goal:** Generate QR codes that contain coupon codes, embed them in emails, and allow vendors to validate/redeem them.

**QR code generation:**

- Add `qrcode` (npm package) dependency to `server/package.json`
- Create a function that generates a QR code as a base64 data URI from a coupon code string
- Embed the QR code as an `<img>` tag in the HTML email body

**QR code content:**

The QR code contains a plain text string:
```
FQ-XXXXXXXXXXXX
```

This is the same coupon code format already used. The QR code is just a machine-readable encoding of it.

**Vendor validation endpoint:**

```
POST /api/vendor/validate-coupon
Headers: Authorization: Bearer <vendor-token>
Body: { code: "FQ-XXXXXXXX" }
```

Response (valid):
```json
{
  "valid": true,
  "couponCode": "FQ-XXXXXXXX",
  "rewardType": "Free Coffee Bundle",
  "playerName": "Player Name",
  "rank": 6,
  "instanceDate": "2026-09-01"
}
```

Response (invalid):
```json
{
  "valid": false,
  "message": "Coupon not found or already redeemed"
}
```

**Redemption endpoint:**

```
POST /api/vendor/redeem-coupon
Headers: Authorization: Bearer <vendor-token>
Body: { code: "FQ-XXXXXXXX" }
```

Response:
```json
{
  "redeemed": true,
  "rewardType": "Free Coffee Bundle",
  "playerName": "Player Name"
}
```

This marks the coupon as `REDEEMED` in the database, preventing reuse.

**Files to modify:**
```
server/package.json              — add "qrcode" dependency
server/src/services/CouponService.ts  — add generateQRCode() method
server/src/services/EmailService.ts   — embed QR in HTML email
server/src/routes/gameResults.ts      — (review existing, may not change)
```

**Files to create:**
```
server/src/routes/vendors.ts
server/src/middleware/vendorAuth.ts
```

---

### 7. Admin API Endpoints

**Goal:** Provide REST endpoints for admin operations.

```
POST /api/admin/start-game
Headers: Authorization: Bearer <admin-token>
Body: { mapId: "rwanda" }
Response: { instanceId: "...", tasks: GameTask[] }

POST /api/admin/end-game
Headers: Authorization: Bearer <admin-token>
Response: { instanceId: "...", leaderboard: [...] }

GET /api/admin/leaderboard/:instanceId
Headers: Authorization: Bearer <admin-token>
Response: { entries: LeaderboardEntry[] }

GET /api/admin/instances
Headers: Authorization: Bearer <admin-token>
Response: { instances: [...] }
```

For simplicity in this event prototype, use a static admin token defined in environment variables:

```env
ADMIN_TOKEN=your-secret-admin-token-here
```

**Files to create:**
```
server/src/routes/admin.ts
server/src/middleware/adminAuth.ts
```

---

### 8. Environment Configuration

**Updated `.env.example`:**

```env
PORT=3001
DATABASE_URL=./farmquest.db
EMAIL_PROVIDER=development
EMAIL_FROM=FarmQuest <rewards@example.com>
EMAIL_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
ADMIN_TOKEN=dev-admin-token-change-me
VITE_API_BASE_URL=/api
```

**Files to modify:**
```
server/.env.example
server/.env (if needed for development)
```

---

### 9. Vendor Portal Page

The vendor portal is a simple HTML page served by the Express server.

**Route:** `GET /vendor`

**Served from:** `server/src/routes/vendorPage.ts` (or inline in server.ts)

**Vendor portal features:**

- Login form (username + password)
- After login: QR code scanner input field (manual code entry for simplicity)
- Validate coupon button
- Redeem coupon button
- Display reward details and player name

**This is a server-rendered HTML page, not part of the Vite-built game.**

**Files to create:**
```
server/src/routes/vendorPage.ts   — serves HTML for vendor portal
server/public/vendor/index.html   — OR static HTML file
```

---

### 10. Deployment Configuration

**Goal:** The server must be deployable behind a domain name.

**What to prepare:**

- Ensure the server listens on `0.0.0.0` (not just `127.0.0.1`)
- The port should be configurable via `PORT` environment variable (already is)
- Add a `GET /` route that serves the built game from `dist/` (or configure nginx separately)
- Add a `GET /vendor` route for the vendor portal
- Ensure CORS is configured for the production domain

**Files to modify:**
```
server/src/server.ts         — serve static files from dist/
server/.env.example          — add admin token
```

---

### 11. Dependencies to Add

**server/package.json new dependencies:**

```json
{
  "ws": "^8.18.0",
  "qrcode": "^1.5.4",
  "bcryptjs": "^2.4.3"
}
```

**server/package.json new devDependencies:**

```json
{
  "@types/ws": "^8.5.12",
  "@types/bcryptjs": "^2.4.6",
  "@types/qrcode": "^1.5.5"
}
```

---

### 12. File Structure (Final)

```
server/src/
├── server.ts                      — main entry, HTTP + WS
├── config/
│   └── env.ts                     — environment loader (existing)
├── routes/
│   ├── players.ts                 — player auth (modify)
│   ├── gameResults.ts             — game completion (modify)
│   ├── admin.ts                   — admin API (new)
│   └── vendorPage.ts              — vendor portal HTML (new)
├── services/
│   ├── CouponService.ts           — coupon + QR generation (modify)
│   ├── EmailService.ts            — email with QR (modify)
│   ├── RewardService.ts           — reward assignment (new)
│   └── AuthService.ts             — session tokens (new)
├── storage/
│   └── database.ts                — all DB queries (modify)
├── types/
│   └── index.ts                   — all types (modify)
├── validation/
│   └── schemas.ts                 — Zod schemas (modify)
├── middleware/
│   ├── adminAuth.ts               — admin token check (new)
│   └── vendorAuth.ts              — vendor token check (new)
└── ws/
    ├── SocketManager.ts           — WebSocket management (new)
    ├── EventHandler.ts            — message routing (new)
    ├── GameCoordinator.ts         — lobby + game state (new)
    └── types.ts                   — WS message types (new)
```

---

### 13. Coordination with Team Members

**What Member 2 (Frontend) needs from you:**

- REST API contract: exact request/response shapes for all endpoints
- WebSocket message protocol: exact types for all messages
- Session token format and how to pass it
- Admin page URL and authentication method

**What Member 3 (Game Engine) needs from you:**

- The task sequence format sent in `game_start` message (must match `GameTask[]`)
- Instance creation API
- Game completion submission API

**What you need from them:**

- Member 2 must tell you what endpoints the login, character select, map select, and admin screens need
- Member 3 must tell you the task sequence format so you can store/send it

---

### 14. Testing Checklist

- [ ] Server starts without errors
- [ ] WebSocket server accepts connections
- [ ] Player can register via REST
- [ ] Player receives session token
- [ ] WebSocket connection validates session
- [ ] Lobby updates broadcast to all clients
- [ ] Admin can start a game
- [ ] Game start sends task sequence to all players
- [ ] Player completion is recorded
- [ ] Leaderboard ranks players correctly
- [ ] Top 10 coupons are generated
- [ ] QR codes are valid and scannable
- [ ] Coupon email contains QR code image
- [ ] Vendor can log in
- [ ] Vendor can validate a coupon
- [ ] Vendor can redeem a coupon (marks as redeemed)
- [ ] Redeemed coupon cannot be redeemed again
- [ ] 300 concurrent WebSocket connections do not crash the server
- [ ] Disconnected players are cleaned up
- [ ] Admin can end a game manually
- [ ] Multiple game instances can run sequentially

---

### 15. Priority Order

Implement in this exact order:

1. Database schema extensions
2. WebSocket server setup (connection, heartbeat, basic messaging)
3. Lobby system (join, broadcast, disconnect handling)
4. Game coordinator (start game, generate tasks, send to clients)
5. Player completion tracking + leaderboard
6. Admin endpoints and auth middleware
7. Coupon generation for top 10
8. QR code generation
9. Email with QR code
10. Vendor auth + validation + redemption endpoints
11. Vendor portal HTML page
12. Static file serving for the game
13. Environment configuration
14. Testing with multiple simulated connections

---

### 16. Definition of Done

Member 1 is done when:

1. The server handles 300 WebSocket connections without crashing
2. An admin can start a game and all connected players receive the task sequence
3. Players who complete the game are ranked by completion time
4. The top 10 players each receive a unique QR-code coupon via email
5. A vendor can log in, scan/enter a coupon code, see the reward details, and redeem it
6. A redeemed coupon cannot be used again
7. All endpoints return proper error responses
8. The server can be started with a single `npm run dev` command
9. The vendor portal is accessible at `/vendor`
10. The game is servable from `dist/` at the root URL
