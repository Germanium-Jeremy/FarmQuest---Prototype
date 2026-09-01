import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  listInstances,
  getLeaderboard,
  getInstance,
} from '../storage/database.js';

export const adminRouter = Router();

// All admin routes require the admin token
adminRouter.use(adminAuth);

// GET /api/admin/instances — list recent instances
adminRouter.get('/instances', (_req, res) => {
  const instances = listInstances();
  res.json({ instances });
});

// GET /api/admin/leaderboard/:instanceId — get leaderboard for an instance
adminRouter.get('/leaderboard/:instanceId', (req, res) => {
  const { instanceId } = req.params;
  const instance = getInstance(instanceId);

  if (!instance) {
    res.status(404).json({ message: 'Instance not found.' });
    return;
  }

  const entries = getLeaderboard(instanceId);
  res.json({ instance, entries });
});
