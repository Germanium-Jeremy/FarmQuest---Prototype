import { Router } from 'express';
<<<<<<< HEAD
import crypto from 'node:crypto';
import { z } from 'zod';
import { vendorAuth, VendorRequest } from '../middleware/vendorAuth.js';
import { getVendorByUsername, createVendorSession, getCouponByCode, redeemCoupon } from '../storage/database.js';

const router = Router();

=======
import { z } from 'zod';
import { vendorAuth } from '../middleware/vendorAuth.js';
import { authService } from '../services/AuthService.js';
import { getCouponByCode, redeemCoupon } from '../storage/database.js';

export const vendorsRouter = Router();

// ── Validation schemas ──────────────────────────────────────────
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

const couponSchema = z.object({
<<<<<<< HEAD
  code: z.string().regex(/^FQ-[A-Z0-9]{6}$/),
});

// Vendor login
router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid credentials.' });
    return;
  }

  const vendor = getVendorByUsername(parsed.data.username);
  if (!vendor) {
    res.status(401).json({ message: 'Invalid username or password.' });
    return;
  }

  // Simple password check (for prototype, compare plaintext hash)
  // In production, use bcryptjs
  const passwordHash = crypto.createHash('sha256').update(parsed.data.password).digest('hex');
  if (passwordHash !== vendor.password_hash) {
    res.status(401).json({ message: 'Invalid username or password.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  createVendorSession(vendor.id, token, expiresAt);

  res.json({
    token,
    vendorId: vendor.id,
    locationName: vendor.location_name,
  });
});

// Validate coupon
router.post('/validate-coupon', vendorAuth, (req, res) => {
=======
  code: z.string().regex(/^FQ-[A-Z0-9]{6}$/, 'Invalid coupon code format'),
});

// ── POST /api/vendor/login ──────────────────────────────────────
vendorsRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid login details.' });
    return;
  }

  try {
    const result = await authService.authenticateVendor(
      parsed.data.username,
      parsed.data.password,
    );
    res.json({
      token: result.token,
      vendorId: result.vendorId,
      locationName: result.locationName,
    });
  } catch {
    res.status(401).json({ message: 'Invalid username or password.' });
  }
});

// ── POST /api/vendor/logout ─────────────────────────────────────
vendorsRouter.post('/logout', vendorAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    authService.logoutVendor(authHeader.slice(7));
  }
  res.json({ ok: true });
});

// ── POST /api/vendor/validate-coupon ────────────────────────────
vendorsRouter.post('/validate-coupon', vendorAuth, (req, res) => {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ valid: false, message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);
<<<<<<< HEAD
  if (!coupon) {
    res.json({ valid: false, message: 'Coupon not found.' });
=======

  if (!coupon) {
    res.status(404).json({ valid: false, message: 'Coupon not found.' });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  if (coupon.status === 'REDEEMED') {
<<<<<<< HEAD
    res.json({ valid: false, message: 'Coupon already redeemed.' });
=======
    res.json({
      valid: false,
      message: 'Coupon has already been redeemed.',
    });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  if (coupon.status === 'EXPIRED') {
<<<<<<< HEAD
    res.json({ valid: false, message: 'Coupon has expired.' });
=======
    res.json({
      valid: false,
      message: 'Coupon has expired.',
    });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  res.json({
    valid: true,
    couponCode: coupon.code,
    rewardType: coupon.reward_type,
<<<<<<< HEAD
    playerName: (coupon as unknown as { display_name?: string }).display_name ?? 'Unknown',
=======
    playerName: coupon.player_name,
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    status: coupon.status,
  });
});

<<<<<<< HEAD
// Redeem coupon
router.post('/redeem-coupon', vendorAuth, (req, res) => {
=======
// ── POST /api/vendor/redeem-coupon ──────────────────────────────
vendorsRouter.post('/redeem-coupon', vendorAuth, (req, res) => {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);
<<<<<<< HEAD
  if (!coupon) {
    res.status(404).json({ message: 'Coupon not found.' });
=======

  if (!coupon) {
    res.status(404).json({ redeemed: false, message: 'Coupon not found.' });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  if (coupon.status === 'REDEEMED') {
<<<<<<< HEAD
    res.status(409).json({ message: 'Coupon already redeemed.' });
=======
    res.json({
      redeemed: false,
      message: 'Coupon has already been redeemed.',
    });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  if (coupon.status === 'EXPIRED') {
<<<<<<< HEAD
    res.status(410).json({ message: 'Coupon has expired.' });
=======
    res.json({
      redeemed: false,
      message: 'Coupon has expired.',
    });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  redeemCoupon(coupon.id);

  res.json({
    redeemed: true,
    rewardType: coupon.reward_type,
<<<<<<< HEAD
    playerName: (coupon as unknown as { display_name?: string }).display_name ?? 'Unknown',
  });
});

export const vendorsRouter = router;
=======
    playerName: coupon.player_name,
    couponCode: coupon.code,
  });
});
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
