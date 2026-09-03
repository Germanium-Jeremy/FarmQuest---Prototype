import { Router } from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import { resolve } from 'node:path';
import { adminAuth } from '../middleware/adminAuth.js';
import { GameCoordinator } from '../ws/GameCoordinator.js';
import {
  getInstancePlayersWithNames,
  getLeaderboard,
  listCollaborators,
  getCollaborator,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  updateVendorPassword,
} from '../storage/database.js';
import {
  createCollaboratorSchema,
  updateCollaboratorSchema,
  createVendorSchema,
  updateVendorSchema,
} from '../validation/schemas.js';

export function createAdminRouter(coordinator: GameCoordinator): Router {
  const router = Router();

  router.use(adminAuth);

  // Upload config
  const uploadDir = resolve(process.env.UPLOAD_DIR ?? './uploads');
  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = file.originalname.split('.').pop() ?? 'png';
      cb(null, `${crypto.randomUUID()}.${ext}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Invalid file type. Allowed: PNG, JPEG, GIF, SVG, WebP'));
    },
  });

  // ─── Instance / Game ────────────────────────────────────────────

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

  // ─── Collaborators ──────────────────────────────────────────────

  router.get('/collaborators', (_req, res) => {
    const collaborators = listCollaborators();
    res.json({ collaborators });
  });

  router.post('/collaborators', upload.single('logo'), (req, res) => {
    const parsed = createCollaboratorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid collaborator data.', errors: parsed.error.flatten() });
      return;
    }
    const file = req.file;
    const collaborator = createCollaborator({
      ...parsed.data,
      logo_path: file?.filename ?? undefined,
      logo_cid: file ? `collab-${crypto.randomUUID()}` : undefined,
    });
    res.status(201).json({ collaborator });
  });

  router.put('/collaborators/:id', upload.single('logo'), (req, res) => {
    const id = String(req.params.id);
    const existing = getCollaborator(id);
    if (!existing) {
      res.status(404).json({ message: 'Collaborator not found.' });
      return;
    }
    const parsed = updateCollaboratorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid collaborator data.', errors: parsed.error.flatten() });
      return;
    }
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (req.file) {
      updateData.logo_path = req.file.filename;
      updateData.logo_cid = `collab-${crypto.randomUUID()}`;
    }
    updateCollaborator(id, updateData as any);
    const updated = getCollaborator(id);
    res.json({ collaborator: updated });
  });

  router.delete('/collaborators/:id', (req, res) => {
    const id = String(req.params.id);
    const existing = getCollaborator(id);
    if (!existing) {
      res.status(404).json({ message: 'Collaborator not found.' });
      return;
    }
    deleteCollaborator(id);
    res.json({ ok: true });
  });

  router.post('/collaborators/reorder', (req, res) => {
    const { order } = req.body as { order: Array<{ id: string; display_order: number }> };
    if (!Array.isArray(order)) {
      res.status(400).json({ message: 'Invalid order data.' });
      return;
    }
    for (const item of order) {
      updateCollaborator(item.id, { display_order: item.display_order });
    }
    res.json({ ok: true });
  });

  // ─── Vendors ────────────────────────────────────────────────────

  router.get('/vendors', (_req, res) => {
    const vendors = listVendors();
    // Never expose password hashes
    const safe = vendors.map(({ password_hash, ...v }) => v);
    res.json({ vendors: safe });
  });

  router.post('/vendors', (req, res) => {
    const parsed = createVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid vendor data.', errors: parsed.error.flatten() });
      return;
    }
    const defaultPassword = parsed.data.password ?? 'FarmQuest2024!';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    const vendorId = crypto.randomUUID();
    createVendor(vendorId, parsed.data.username, passwordHash, parsed.data.location_name, parsed.data.contact_email);
    res.status(201).json({
      vendorId,
      username: parsed.data.username,
      location_name: parsed.data.location_name,
      contact_email: parsed.data.contact_email,
      default_password: defaultPassword,
      message: 'Vendor created. Share the default password securely — it will not be shown again.',
    });
  });

  router.put('/vendors/:id', (req, res) => {
    const { id } = req.params;
    const parsed = updateVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid vendor data.', errors: parsed.error.flatten() });
      return;
    }
    updateVendor(id, parsed.data);
    res.json({ ok: true });
  });

  router.delete('/vendors/:id', (req, res) => {
    const { id } = req.params;
    deleteVendor(id);
    res.json({ ok: true });
  });

  router.post('/vendors/:id/reset-password', (req, res) => {
    const { id } = req.params;
    const defaultPassword = 'FarmQuest2024!';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    updateVendor(id, {} as any); // just to trigger update
    updateVendorPassword(id, passwordHash);
    res.json({ default_password: defaultPassword });
  });

  return router;
}
