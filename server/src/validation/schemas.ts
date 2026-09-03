import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const uuid = z.string().uuid();
const score = z.number().int().min(0).max(100000);
const mapId = z.enum(['rwanda', 'sudan', 'seychelles']);

export const registerSchema = z.object({
  email,
  displayName: z.string().trim().min(1, 'Display name is required').max(40),
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

export const instanceStartSchema = z.object({
  sessionId: uuid,
  mapId,
});

export const gameCompleteSchema = z.object({
  sessionId: uuid,
  score,
  completionTime: z.number().min(0).max(3600).optional(),
});

export const vendorLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

export const couponCodeSchema = z.object({
  code: z.string().regex(/^FQ-[A-Z0-9]{6}$/, 'Invalid coupon code format'),
});

// ─── Collaborator schemas ──────────────────────────────────────────

export const createCollaboratorSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(100),
  contacts: z.string().trim().min(1, 'Contacts are required').max(500),
  url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')).transform(v => v || undefined),
  display_order: z.number().int().min(0).max(999).optional(),
});

export const updateCollaboratorSchema = z.object({
  company_name: z.string().trim().min(1).max(100).optional(),
  contacts: z.string().trim().min(1).max(500).optional(),
  url: z.string().max(500).optional().or(z.literal('')).transform(v => v || undefined),
  display_order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.coerce.number().int().min(0).max(1).optional(),
});

// ─── Vendor admin schemas ──────────────────────────────────────────

export const createVendorSchema = z.object({
  username: z.string().trim().min(1).max(50),
  location_name: z.string().trim().min(1).max(100),
  contact_email: email,
  password: z.string().min(6).max(100).optional(),
});

export const updateVendorSchema = z.object({
  username: z.string().trim().min(1).max(50).optional(),
  location_name: z.string().trim().min(1).max(100).optional(),
  contact_email: email.optional(),
  active: z.coerce.number().int().min(0).max(1).optional(),
});

export const reorderCollaboratorsSchema = z.object({
  order: z.array(z.object({
    id: uuid,
    display_order: z.number().int().min(0),
  })),
});
