import '../config/env.js';
import { Router } from 'express';
import { CouponService } from '../services/CouponService.js';
import { createEmailService } from '../services/EmailService.js';
import {
  completeSession,
  getCompletedLevels,
  getPlayer,
  getSession,
  markCouponSent,
  recordLevelComplete,
} from '../storage/database.js';
import { gameCompleteSchema, levelCompleteSchema } from '../validation/schemas.js';

export const gameResultsRouter = Router();
const couponService = new CouponService();
const emailService = createEmailService();

gameResultsRouter.post('/level-complete', (req, res) => {
  const parsed = levelCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid level result.' });
    return;
  }

  const session = getSession(parsed.data.sessionId);
  if (!session || session.status !== 'IN_PROGRESS') {
    res.status(404).json({ message: 'Active session not found.' });
    return;
  }

  const completedLevels = getCompletedLevels(session.id);
  const expectedLevel = completedLevels.length + 1;
  if (parsed.data.level !== expectedLevel && !completedLevels.includes(parsed.data.level)) {
    res.status(409).json({ message: 'Level progression is invalid.' });
    return;
  }

  recordLevelComplete(session.id, parsed.data.level, parsed.data.score);
  res.json({ ok: true });
});

gameResultsRouter.post('/complete', async (req, res) => {
  const parsed = gameCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid completion result.' });
    return;
  }

  const session = getSession(parsed.data.sessionId);
  if (!session) {
    res.status(404).json({ message: 'Session not found.' });
    return;
  }

  const completedLevels = getCompletedLevels(session.id);
  if (![1, 2, 3].every((level) => completedLevels.includes(level))) {
    res.status(409).json({ message: 'All levels must be completed before claiming a reward.' });
    return;
  }

  const player = getPlayer(session.player_id);
  if (!player) {
    res.status(404).json({ message: 'Player not found.' });
    return;
  }

  completeSession(session.id, parsed.data.score);
  const { coupon, alreadyIssued } = couponService.getOrCreateCoupon(player.id, session.id);
  let emailSent = coupon.status === 'SENT';

  if (!emailSent) {
    try {
      await emailService.sendCouponEmail({
        to: player.email,
        couponCode: coupon.code,
        rewardName: coupon.reward_type,
        score: parsed.data.score,
      });
      markCouponSent(coupon.id);
      emailSent = true;
    } catch (error) {
      console.error('Coupon email failed', error);
    }
  }

  res.json({
    couponCode: coupon.code,
    rewardName: coupon.reward_type,
    emailSent,
    alreadyIssued,
  });
});
