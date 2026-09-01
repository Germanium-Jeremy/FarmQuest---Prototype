import '../config/env.js';
import { Router } from 'express';
import { createSession, getPlayer, getSession, upsertPlayer } from '../storage/database.js';
import { newSessionSchema, registerSchema } from '../validation/schemas.js';

export const playersRouter = Router();

// POST /api/players/register — register or login with email
playersRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid registration details.' });
    return;
  }

  const player = upsertPlayer(parsed.data.email, parsed.data.displayName);
  const session = createSession(player.id);
  res.json({
    playerId: player.id,
    sessionId: session.id,
    displayName: player.display_name ?? 'Player',
  });
});

// POST /api/players/login — functionally identical to register (email-based)
playersRouter.post('/login', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid login details.' });
    return;
  }

  const player = upsertPlayer(parsed.data.email, parsed.data.displayName);
  const session = createSession(player.id);
  res.json({
    playerId: player.id,
    sessionId: session.id,
    displayName: player.display_name ?? 'Player',
  });
});

// POST /api/players/session — create a new session for an existing player
playersRouter.post('/session', (req, res) => {
  const parsed = newSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid player.' });
    return;
  }

  const player = getPlayer(parsed.data.playerId);
  if (!player) {
    res.status(404).json({ message: 'Player not found.' });
    return;
  }

  const session = createSession(player.id);
  res.json({ sessionId: session.id });
});

// GET /api/players/me?sessionId=XXX — return player info for session resumption
playersRouter.get('/me', (req, res) => {
  const sessionId = req.query.sessionId as string | undefined;
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId query parameter required.' });
    return;
  }

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ message: 'Session not found.' });
    return;
  }

  const player = getPlayer(session.player_id);
  if (!player) {
    res.status(404).json({ message: 'Player not found.' });
    return;
  }

  res.json({
    playerId: player.id,
    sessionId: session.id,
    displayName: player.display_name ?? 'Player',
    email: player.email,
    status: session.status,
    score: session.total_score,
  });
});
