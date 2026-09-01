import './config/env.js';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { playersRouter } from './routes/players.js';
import { gameResultsRouter } from './routes/gameResults.js';
import { adminRouter } from './routes/admin.js';
import { vendorsRouter } from './routes/vendors.js';
import { vendorPageRouter } from './routes/vendorPage.js';
import { SocketManager } from './ws/SocketManager.js';
import { EventHandler } from './ws/EventHandler.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── Rate limiting ───────────────────────────────────────────────
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith('/api/players') && !req.path.startsWith('/api/game')) {
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

// ── Middleware ───────────────────────────────────────────────────
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

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── API routes ──────────────────────────────────────────────────
app.use('/api/players', playersRouter);
app.use('/api/game', gameResultsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/vendor', vendorsRouter);

// ── Vendor portal page ──────────────────────────────────────────
app.use('/vendor', vendorPageRouter);

// ── Static file serving for the built game ──────────────────────
const distPath = resolve(import.meta.dirname ?? process.cwd(), '../../dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: serve index.html for non-API, non-vendor routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/vendor')) {
      next();
      return;
    }
    res.sendFile(resolve(distPath, 'index.html'));
  });
}

// ── Error handler ───────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong.' });
});

// ── Create HTTP server + WebSocket ──────────────────────────────
const server = createServer(app);
const socketManager = new SocketManager(server);
const eventHandler = new EventHandler(socketManager);

// ── Start server ────────────────────────────────────────────────
server.listen(port, '0.0.0.0', () => {
  console.info(`FarmQuest server listening on http://0.0.0.0:${port}`);
  console.info(`Vendor portal: http://0.0.0.0:${port}/vendor`);
  console.info(`WebSocket: ws://0.0.0.0:${port}/ws`);
});

// ── Graceful shutdown ───────────────────────────────────────────
function shutdown(signal: string): void {
  console.info(`\n[${signal}] Shutting down gracefully...`);
  socketManager.closeAll();
  server.close(() => {
    console.info('Server closed.');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
