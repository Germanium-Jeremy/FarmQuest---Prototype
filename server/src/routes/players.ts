import '../config/env.js';
import { Router } from 'express';
import { createSession, getPlayer, upsertPlayer } from '../storage/database.js';
import { newSessionSchema, registerSchema } from '../validation/schemas.js';

export const playersRouter = Router();

playersRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid registration details.' });
    return;
  }

  const player = upsertPlayer(parsed.data.email, parsed.data.displayName);
  const session = createSession(player.id);
  res.json({ playerId: player.id, sessionId: session.id });
});

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
