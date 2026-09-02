import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
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
