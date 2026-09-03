import '../config/env.js';
import { Router } from 'express';
import { InstanceTaskService } from '../services/InstanceTaskService.js';
import {
  completeSession,
  getCompletedLevels,
  getPlayer,
  getSession,
  recordLevelComplete,
} from '../storage/database.js';
import { gameCompleteSchema, instanceStartSchema, levelCompleteSchema } from '../validation/schemas.js';

export const gameResultsRouter = Router();
const instanceTaskService = new InstanceTaskService();

gameResultsRouter.post('/instance', (req, res) => {
  const parsed = instanceStartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid game instance request.' });
    return;
  }

  const session = getSession(parsed.data.sessionId);
  if (!session || session.status !== 'IN_PROGRESS') {
    res.status(404).json({ message: 'Active session not found.' });
    return;
  }

  const instance = instanceTaskService.createInstance();
  res.json({ ...instance, mapId: parsed.data.mapId });
});

gameResultsRouter.post('/level-complete', (req, res) => {
  const parsed = levelCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid level result.' });
    return;
  }

  const session = getSession(parsed.data.sessionId);
  if (!session || session.status !== 'IN_PROGRESS') {
    res.status(404).json({ message: 'Active session not found.' });
    return;
  }

  const completedLevels = getCompletedLevels(session.id);
  const expectedLevel = completedLevels.length + 1;
  if (parsed.data.level !== expectedLevel && !completedLevels.includes(parsed.data.level)) {
    res.status(409).json({ message: 'Level progression is invalid.' });
    return;
  }

  recordLevelComplete(session.id, parsed.data.level, parsed.data.score);
  res.json({ ok: true });
});

// Game completion endpoint — marks session complete but does NOT issue rewards.
// Rewards are finalized server-side when the game event ends (all players finished
// or admin ends the game). The WebSocket path handles reward issuance.
gameResultsRouter.post('/complete', async (req, res) => {
  const parsed = gameCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid completion result.' });
    return;
  }

  const session = getSession(parsed.data.sessionId);
  if (!session) {
    res.status(404).json({ message: 'Session not found.' });
    return;
  }

  completeSession(session.id, parsed.data.score);

  res.json({
    rewardName: 'Free Coffee',
    emailSent: false,
    alreadyIssued: false,
    message: 'Game completed. Rewards will be sent after the event ends.',
  });
});
