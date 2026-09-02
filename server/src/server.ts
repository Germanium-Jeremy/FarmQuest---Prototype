import './config/env.js';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { playersRouter } from './routes/players.js';
import { gameResultsRouter } from './routes/gameResults.js';
import { createAdminRouter } from './routes/admin.js';
import { vendorsRouter } from './routes/vendors.js';
import { vendorPageRouter } from './routes/vendorPage.js';
import { adminPageRouter } from './routes/adminPage.js';
import { SocketManager } from './ws/SocketManager.js';
import { GameCoordinator } from './ws/GameCoordinator.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const hits = new Map<string, { count: number; resetAt: number }>();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed'));
  },
}));
app.use(express.json({ limit: '20kb' }));
app.use(rateLimit);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/players', playersRouter);
app.use('/api/game', gameResultsRouter);

// New routes
const coordinator = new GameCoordinator();
const socketManager = new SocketManager(coordinator);

app.use('/api/admin', createAdminRouter(coordinator));
app.use('/api/vendor', vendorsRouter);
app.use('/vendor', vendorPageRouter);
app.use('/admin', adminPageRouter);

// Serve static game files from dist/
const distPath = resolve(import.meta.dirname ?? '.', '../dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for non-API, non-admin routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/vendor') || req.path.startsWith('/admin')) {
    res.status(404).json({ message: 'Not found.' });
    return;
  }
  res.sendFile(resolve(distPath, 'index.html'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong.' });
});

// Create HTTP server and attach WebSocket
const server = createServer(app);
socketManager.attachToServer(server);

server.listen(port, '0.0.0.0', () => {
  console.info(`FarmQuest server listening on http://0.0.0.0:${port}`);
});

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith('/api/players') && !req.path.startsWith('/api/game') && !req.path.startsWith('/api/vendor') && !req.path.startsWith('/api/admin')) {
    next();
    return;
  }

  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const current = hits.get(key);

  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  current.count += 1;
  if (current.count > 60) {
    res.status(429).json({ message: 'Please wait before trying again.' });
    return;
  }

  next();
}
