import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const uuid = z.string().uuid();
const score = z.number().int().min(0).max(100000);

export const registerSchema = z.object({
  email,
  displayName: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
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

export const gameCompleteSchema = z.object({
  sessionId: uuid,
  score,
});

export const vendorLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

export const couponCodeSchema = z.object({
  code: z.string().regex(/^FQ-[A-Z0-9]{6}$/, 'Invalid coupon code format'),
});
