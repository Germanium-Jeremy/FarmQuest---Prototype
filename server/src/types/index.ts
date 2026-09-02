export type SessionStatus = 'IN_PROGRESS' | 'FAILED' | 'COMPLETED';
export type CouponStatus = 'CREATED' | 'SENT' | 'REDEEMED' | 'EXPIRED';
export type InstanceStatus = 'WAITING' | 'IN_PLAY' | 'FINISHED';
export type InstancePlayerStatus = 'REGISTERED' | 'PLAYING' | 'COMPLETED' | 'TIMEOUT';

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

export interface EventInstanceRow {
  id: string;
  map_id: string;
  status: InstanceStatus;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface InstancePlayerRow {
  id: string;
  instance_id: string;
  player_id: string;
  session_id: string;
  character_type: string;
  map_id: string;
  status: InstancePlayerStatus;
  score: number;
  completion_time: number | null;
  completed_at: string | null;
}

export interface LeaderboardRow {
  id: string;
  instance_id: string;
  player_id: string;
  rank: number;
  score: number;
  completion_time: number | null;
  reward_type: string | null;
  coupon_id: string | null;
}

export interface VendorRow {
  id: string;
  username: string;
  password_hash: string;
  location_name: string;
  created_at: string;
}

export interface VendorSessionRow {
  id: string;
  vendor_id: string;
  token: string;
  expires_at: string;
}
