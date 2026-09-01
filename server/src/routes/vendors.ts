import { Router } from 'express';
import { z } from 'zod';
import { vendorAuth } from '../middleware/vendorAuth.js';
import { authService } from '../services/AuthService.js';
import { getCouponByCode, redeemCoupon } from '../storage/database.js';

export const vendorsRouter = Router();

// ── Validation schemas ──────────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

const couponSchema = z.object({
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
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ valid: false, message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);

  if (!coupon) {
    res.status(404).json({ valid: false, message: 'Coupon not found.' });
    return;
  }

  if (coupon.status === 'REDEEMED') {
    res.json({
      valid: false,
      message: 'Coupon has already been redeemed.',
    });
    return;
  }

  if (coupon.status === 'EXPIRED') {
    res.json({
      valid: false,
      message: 'Coupon has expired.',
    });
    return;
  }

  res.json({
    valid: true,
    couponCode: coupon.code,
    rewardType: coupon.reward_type,
    playerName: coupon.player_name,
    status: coupon.status,
  });
});

// ── POST /api/vendor/redeem-coupon ──────────────────────────────
vendorsRouter.post('/redeem-coupon', vendorAuth, (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);

  if (!coupon) {
    res.status(404).json({ redeemed: false, message: 'Coupon not found.' });
    return;
  }

  if (coupon.status === 'REDEEMED') {
    res.json({
      redeemed: false,
      message: 'Coupon has already been redeemed.',
    });
    return;
  }

  if (coupon.status === 'EXPIRED') {
    res.json({
      redeemed: false,
      message: 'Coupon has expired.',
    });
    return;
  }

  redeemCoupon(coupon.id);

  res.json({
    redeemed: true,
    rewardType: coupon.reward_type,
    playerName: coupon.player_name,
    couponCode: coupon.code,
  });
});
