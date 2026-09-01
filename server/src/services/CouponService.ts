import crypto from 'node:crypto';
import { getCouponForSession, insertCoupon } from '../storage/database.js';
import { CouponRow } from '../types/index.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class CouponService {
  getOrCreateCoupon(playerId: string, sessionId: string): { coupon: CouponRow; alreadyIssued: boolean } {
    const existing = getCouponForSession(sessionId);
    if (existing) return { coupon: existing, alreadyIssued: true };

    for (let attempt = 0; attempt < 8; attempt++) {
      const code = this.createCode();
      try {
        return {
          coupon: insertCoupon(playerId, sessionId, code, 'Free Coffee'),
          alreadyIssued: false,
        };
      } catch (error) {
        if (attempt === 7) throw error;
      }
    }

    throw new Error('Could not create coupon');
  }

  private createCode(): string {
    const bytes = crypto.randomBytes(6);
    const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
    return `FQ-${suffix}`;
  }
}
