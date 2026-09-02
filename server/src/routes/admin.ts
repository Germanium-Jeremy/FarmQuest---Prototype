import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
<<<<<<< HEAD
import { GameCoordinator } from '../ws/GameCoordinator.js';
import { getInstancePlayersWithNames, getLeaderboard } from '../storage/database.js';

export function createAdminRouter(coordinator: GameCoordinator): Router {
  const router = Router();

  router.use(adminAuth);

  router.get('/instances', (_req, res) => {
    res.json({
      currentInstance: coordinator.getCurrentInstanceId(),
      status: coordinator.getStatus(),
      lobbyCount: coordinator.getLobbyCount(),
    });
  });

  router.get('/leaderboard/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    const entries = getLeaderboard(instanceId);
    res.json({ entries });
  });

  router.get('/players/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    const players = getInstancePlayersWithNames(instanceId);
    res.json({ players });
  });

  return router;
}
=======
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
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
