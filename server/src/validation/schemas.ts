import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const uuid = z.string().uuid();
const score = z.number().int().min(0).max(100000);
const mapId = z.enum(['rwanda', 'sudan', 'seychelles']);

export const registerSchema = z.object({
  email,
  displayName: z.string().trim().max(40).optional(),
});

export const newSessionSchema = z.object({
  playerId: uuid,
});

export const levelCompleteSchema = z.object({
  sessionId: uuid,
  level: z.number().int().min(1).max(3),
  score,
});

export const instanceStartSchema = z.object({
  sessionId: uuid,
  mapId,
});

export const gameCompleteSchema = z.object({
  sessionId: uuid,
  score,
  completionTime: z.number().min(0).max(3600).optional(),
});
