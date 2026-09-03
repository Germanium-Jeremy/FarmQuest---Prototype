import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { vendorAuth, VendorRequest } from '../middleware/vendorAuth.js';
import { getVendorByUsername, createVendorSession, getCouponByCode, atomicRedeemCoupon } from '../storage/database.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

const couponSchema = z.object({
  code: z.string().regex(/^FQ-[A-Z0-9]{6}$/),
});

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
    mustChangePassword: !!vendor.must_change_password,
  });
});

router.post('/validate-coupon', vendorAuth, (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ valid: false, message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);
  if (!coupon) {
    res.json({ valid: false, message: 'Coupon not found.' });
    return;
  }

  if (coupon.status === 'REDEEMED') {
    res.json({ valid: false, message: 'Coupon already redeemed.' });
    return;
  }

  if (coupon.status === 'EXPIRED') {
    res.json({ valid: false, message: 'Coupon has expired.' });
    return;
  }

  res.json({
    valid: true,
    couponCode: coupon.code,
    rewardType: coupon.reward_type,
    playerName: (coupon as unknown as { display_name?: string }).display_name ?? 'Unknown',
    status: coupon.status,
  });
});

// Atomic redemption: validates and redeems in one step
router.post('/redeem-coupon', vendorAuth, (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);
  if (!coupon) {
    res.status(404).json({ message: 'Coupon not found.' });
    return;
  }

  if (coupon.status === 'EXPIRED') {
    res.status(410).json({ message: 'Coupon has expired.' });
    return;
  }

  if (coupon.status === 'REDEEMED') {
    res.status(409).json({ message: 'Coupon already redeemed.' });
    return;
  }

  // Atomic redemption — only one concurrent request can succeed
  const redeemed = atomicRedeemCoupon(coupon.id, 'REDEEMED');
  if (!redeemed) {
    res.status(409).json({ message: 'Coupon already redeemed.' });
    return;
  }

  res.json({
    redeemed: true,
    rewardType: coupon.reward_type,
    playerName: (coupon as unknown as { display_name?: string }).display_name ?? 'Unknown',
  });
});

// QR code scan endpoint — validates and redeems in one atomic step
router.post('/scan-coupon', vendorAuth, (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ valid: false, message: 'Invalid coupon code format.' });
    return;
  }

  const coupon = getCouponByCode(parsed.data.code);
  if (!coupon) {
    res.json({ valid: false, message: 'Coupon not found.' });
    return;
  }

  if (coupon.status === 'EXPIRED') {
    res.json({ valid: false, message: 'Coupon has expired.' });
    return;
  }

  if (coupon.status === 'REDEEMED') {
    res.json({ valid: false, message: 'Coupon already redeemed.' });
    return;
  }

  // Atomic: validate + redeem
  const redeemed = atomicRedeemCoupon(coupon.id, 'REDEEMED');
  if (!redeemed) {
    res.json({ valid: false, message: 'Coupon already redeemed.' });
    return;
  }

  res.json({
    valid: true,
    redeemed: true,
    couponCode: coupon.code,
    rewardType: coupon.reward_type,
    playerName: (coupon as unknown as { display_name?: string }).display_name ?? 'Unknown',
  });
});

export const vendorsRouter = router;
