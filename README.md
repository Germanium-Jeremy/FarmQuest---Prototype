# FarmQuest 🌾

A stylized low-poly 3D farming web game built with Three.js. Players complete randomized farming challenges — collecting seeds, planting crops, finding water, watering plants, and harvesting — while competing for the top spot on the leaderboard.

## Features

- 🎮 **Dynamic Task System** — Randomized challenge sequences each game session
- 🗺️ **3 Map Themes** — Rwanda (Wet Land), Sudan (Desert), Seychelles (Water Land)
- 👤 **3 Character Variants** — Male, Female, Robot with unique visuals
- 🌽 **3 Crop Types** — Maize, Cassava, Coffee with distinct models
- 🏆 **Real-time Multiplayer** — WebSocket-based lobby, leaderboard, admin control
- 📧 **QR Code Coupons** — Top-10 players receive reward coupons via email
- 🏪 **Vendor Portal** — Validate and redeem QR code coupons
- 📊 **Admin Dashboard** — Large-screen display for event management

## Quick Start (Development)

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both client and server
npm run dev          # Vite dev server on port 3000
npm run dev:server   # Express server on port 3001
```

Open http://localhost:3000 in your browser.

## Docker Deployment (Production)

### Prerequisites

- Docker and Docker Compose installed

### Deploy

```bash
# Clone and configure
cp .env.example .env
# Edit .env and set a secure ADMIN_TOKEN

# Build and start
docker compose up -d --build

# Or using Make
make prod
```

The application will be available at:
- **Game:** http://localhost
- **Admin Dashboard:** http://localhost/admin
- **Vendor Portal:** http://localhost/vendor

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | External port (nginx) |
| `ADMIN_TOKEN` | `dev-admin-token-change-me` | Token for admin dashboard access |
| `EMAIL_PROVIDER` | `development` | `development` (console) or `smtp` |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `465` | SMTP server port |
| `SMTP_USER` | - | SMTP username |
| `SMTP_PASS` | - | SMTP password |

### Useful Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose down && docker compose up -d --build

# Stop and clean everything
docker compose down -v --rmi all
```

## Architecture

```
┌─────────────────────────────────────┐
│           Nginx (port 80)           │
│  Static files + Reverse Proxy       │
├──────────────┬──────────────────────┤
│   /api/*     │  /ws → WebSocket     │
│   /vendor    │  /admin              │
├──────────────┴──────────────────────┤
│     Express Server (port 3001)      │
│  REST API + WebSocket + SQLite      │
└─────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** TypeScript, Three.js, Vite
- **Backend:** Express, WebSocket (`ws`), SQLite (`node:sqlite`)
- **Deployment:** Docker, Nginx

## Project Structure

```
src/
├── main.ts                 # Entry point
├── game/                   # Game logic
│   ├── Game.ts             # Main orchestrator
│   ├── ChallengeManager.ts # Task progression
│   ├── ScoreManager.ts     # Score tracking
│   └── GameState.ts        # State machine
├── player/                 # Character
│   ├── Player.ts           # Character controller
│   └── PlayerModel.ts      # Model factory
├── world/                  # 3D world
│   ├── World.ts            # Terrain + decorations
│   ├── SpawnManager.ts     # Spawn points per map
│   ├── Seed.ts, Crop.ts    # Game objects
│   └── NPC.ts              # Map-specific NPCs
├── data/                   # Configuration
│   ├── MapTheme.ts         # Map visual themes
│   ├── CharacterType.ts    # Character variants
│   └── CropType.ts         # Crop definitions
├── ui/                     # HUD + screens
│   └── HUD.ts              # All UI screens
├── api/                    # Client API
│   ├── FarmQuestApi.ts     # REST client
│   └── GameSocket.ts       # WebSocket client
└── admin/                  # Admin dashboard
    └── admin.html

server/src/
├── server.ts               # Express + WebSocket server
├── ws/                     # WebSocket handlers
│   ├── SocketManager.ts    # Connection management
│   ├── GameCoordinator.ts  # Game state + leaderboard
│   └── EventHandler.ts     # Message routing
├── routes/                 # REST endpoints
├── services/               # Coupon + Email
├── storage/database.ts     # SQLite queries
└── middleware/              # Auth middleware
```
