export type SessionStatus = 'IN_PROGRESS' | 'FAILED' | 'COMPLETED';
export type CouponStatus = 'CREATED' | 'SENT' | 'REDEEMED' | 'EXPIRED';

export interface PlayerRow {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface SessionRow {
  id: string;
  player_id: string;
  started_at: string;
  completed_at: string | null;
  status: SessionStatus;
  total_score: number;
  highest_level: number;
}

export interface CouponRow {
  id: string;
  player_id: string;
  session_id: string;
  code: string;
  reward_type: string;
  status: CouponStatus;
  created_at: string;
  sent_at: string | null;
  redeemed_at: string | null;
}
