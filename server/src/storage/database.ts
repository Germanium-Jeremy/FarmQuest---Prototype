import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { CouponRow, PlayerRow, SessionRow } from '../types/index.js';

const databasePath = resolve(process.env.DATABASE_URL ?? './farmquest.db');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    total_score INTEGER NOT NULL DEFAULT 0,
    highest_level INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS level_results (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    level_number INTEGER NOT NULL,
    score INTEGER NOT NULL,
    completed INTEGER NOT NULL,
    completed_at TEXT NOT NULL,
    UNIQUE(session_id, level_number),
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    reward_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    redeemed_at TEXT,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
  );
`);

export function upsertPlayer(email: string, displayName?: string): PlayerRow {
  const existing = db.prepare('SELECT * FROM players WHERE email = ?').get(email) as PlayerRow | undefined;
  if (existing) return existing;

  const player: PlayerRow = {
    id: randomUUID(),
    email,
    display_name: displayName || null,
    created_at: new Date().toISOString(),
  };
  db.prepare('INSERT INTO players (id, email, display_name, created_at) VALUES (?, ?, ?, ?)')
    .run(player.id, player.email, player.display_name, player.created_at);
  return player;
}

export function getPlayer(playerId: string): PlayerRow | undefined {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) as PlayerRow | undefined;
}

export function createSession(playerId: string): SessionRow {
  const session: SessionRow = {
    id: randomUUID(),
    player_id: playerId,
    started_at: new Date().toISOString(),
    completed_at: null,
    status: 'IN_PROGRESS',
    total_score: 0,
    highest_level: 0,
  };
  db.prepare('INSERT INTO game_sessions (id, player_id, started_at, status, total_score, highest_level) VALUES (?, ?, ?, ?, ?, ?)')
    .run(session.id, session.player_id, session.started_at, session.status, session.total_score, session.highest_level);
  return session;
}

export function getSession(sessionId: string): SessionRow | undefined {
  return db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(sessionId) as SessionRow | undefined;
}

export function recordLevelComplete(sessionId: string, level: number, score: number): void {
  const completedAt = new Date().toISOString();
  const existing = db.prepare('SELECT score FROM level_results WHERE session_id = ? AND level_number = ?').get(sessionId, level) as { score: number } | undefined;
  db.prepare(`
    INSERT INTO level_results (id, session_id, level_number, score, completed, completed_at)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(session_id, level_number) DO UPDATE SET
      score = excluded.score,
      completed = 1,
      completed_at = excluded.completed_at
  `).run(randomUUID(), sessionId, level, score, completedAt);
  const delta = score - (existing?.score ?? 0);
  db.prepare('UPDATE game_sessions SET highest_level = max(highest_level, ?), total_score = max(0, total_score + ?) WHERE id = ?')
    .run(level, delta, sessionId);
}

export function getCompletedLevels(sessionId: string): number[] {
  const rows = db.prepare('SELECT level_number FROM level_results WHERE session_id = ? AND completed = 1 ORDER BY level_number ASC').all(sessionId) as Array<{ level_number: number }>;
  return rows.map((row) => row.level_number);
}

export function completeSession(sessionId: string, score: number): void {
  db.prepare('UPDATE game_sessions SET status = ?, completed_at = ?, total_score = max(total_score, ?), highest_level = 3 WHERE id = ?')
    .run('COMPLETED', new Date().toISOString(), score, sessionId);
}

export function getCouponForSession(sessionId: string): CouponRow | undefined {
  return db.prepare('SELECT * FROM coupons WHERE session_id = ?').get(sessionId) as CouponRow | undefined;
}

export function insertCoupon(playerId: string, sessionId: string, code: string, rewardType: string): CouponRow {
  const coupon: CouponRow = {
    id: randomUUID(),
    player_id: playerId,
    session_id: sessionId,
    code,
    reward_type: rewardType,
    status: 'CREATED',
    created_at: new Date().toISOString(),
    sent_at: null,
    redeemed_at: null,
  };
  db.prepare('INSERT INTO coupons (id, player_id, session_id, code, reward_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(coupon.id, coupon.player_id, coupon.session_id, coupon.code, coupon.reward_type, coupon.status, coupon.created_at);
  return coupon;
}

export function markCouponSent(couponId: string): void {
  db.prepare('UPDATE coupons SET status = ?, sent_at = ? WHERE id = ?').run('SENT', new Date().toISOString(), couponId);
}
