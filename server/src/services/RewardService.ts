import QRCode from 'qrcode';
import { insertCoupon, markCouponSent } from '../storage/database.js';
import { CouponService } from './CouponService.js';

const REWARD_TYPES = [
  'Grand Prize - Premium Gift Basket',
  '2nd Place - Restaurant Voucher',
  '3rd Place - Coffee Shop Gift Card',
  '4th Place - Grocery Store Coupon',
  '5th Place - Movie Tickets',
  '6th Place - Free Coffee Bundle',
  '7th Place - FarmQuest Merchandise',
  '8th Place - Snack Pack',
  '9th Place - Free Parking Voucher',
  '10th Place - FarmQuest Sticker Pack',
];

export interface RewardResult {
  rank: number;
  playerId: string;
  couponCode: string;
  rewardType: string;
  qrDataUri: string;
}

export class RewardService {
  private couponService = new CouponService();

  async generateRewards(
    completions: Array<{
      playerId: string;
      score: number;
      completionTime: number;
      sessionId?: string;
    }>,
  ): Promise<RewardResult[]> {
    const results: RewardResult[] = [];

    for (let i = 0; i < Math.min(completions.length, 10); i++) {
      const completion = completions[i];
      const rewardType = REWARD_TYPES[i];
      const rank = i + 1;

      // Generate coupon code
      const { coupon, alreadyIssued } = this.couponService.getOrCreateCoupon(
        completion.playerId,
        completion.sessionId ?? `leaderboard-${Date.now()}-${i}`,
      );

      if (!alreadyIssued) {
        // Override reward type
        markCouponSent(coupon.id);
      }

      // Generate QR code as data URI
      const qrDataUri = await QRCode.toDataURL(coupon.code, {
        width: 200,
        margin: 2,
        color: {
          dark: '#173320',
          light: '#ffffff',
        },
      });

      results.push({
        rank,
        playerId: completion.playerId,
        couponCode: coupon.code,
        rewardType: rewardType ?? coupon.reward_type,
        qrDataUri,
      });
    }

    return results;
  }

  async generateQrDataUri(code: string): Promise<string> {
    return QRCode.toDataURL(code, {
      width: 200,
      margin: 2,
      color: {
        dark: '#173320',
        light: '#ffffff',
      },
    });
  }
}

export const rewardService = new RewardService();
