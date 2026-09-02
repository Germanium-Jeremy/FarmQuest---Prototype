import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
<<<<<<< HEAD
import { CouponRow, EventInstanceRow, InstancePlayerRow, LeaderboardRow, PlayerRow, SessionRow, VendorRow, VendorSessionRow } from '../types/index.js';
=======
import {
  CouponRow,
  EventInstanceRow,
  InstancePlayerRow,
  LeaderboardRow,
  PlayerRow,
  SessionRow,
  VendorRow,
  VendorSessionRow,
} from '../types/index.js';
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7

const databasePath = resolve(process.env.DATABASE_URL ?? './farmquest.db');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON');

// ── Schema creation ─────────────────────────────────────────────
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

  CREATE TABLE IF NOT EXISTS event_instances (
    id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_by TEXT,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS instance_players (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    character_type TEXT NOT NULL,
    map_id TEXT NOT NULL,
    status TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    completion_time REAL,
    completed_at TEXT,
    FOREIGN KEY (instance_id) REFERENCES event_instances(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (session_id) REFERENCES game_sessions(id),
    UNIQUE(instance_id, player_id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    completion_time REAL,
    reward_type TEXT,
    coupon_id TEXT,
    FOREIGN KEY (instance_id) REFERENCES event_instances(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    location_name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vendor_sessions (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );
`);

<<<<<<< HEAD
// --- Existing helpers ---
=======
// Helper to cast db.all() results
/* eslint-disable @typescript-eslint/no-explicit-any */
function queryAll<T>(sql: string, ...params: any[]): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}

function queryGet<T>(sql: string, ...params: any[]): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Player helpers
// ═══════════════════════════════════════════════════════════════════
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7

export function upsertPlayer(email: string, displayName?: string): PlayerRow {
  const existing = queryGet<PlayerRow>('SELECT * FROM players WHERE email = ?', email);
  if (existing) {
    if (displayName && displayName !== existing.display_name) {
      db.prepare('UPDATE players SET display_name = ? WHERE id = ?').run(displayName, existing.id);
      return { ...existing, display_name: displayName };
    }
    return existing;
  }

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
  return queryGet<PlayerRow>('SELECT * FROM players WHERE id = ?', playerId);
}

export function getPlayerByEmail(email: string): PlayerRow | undefined {
  return queryGet<PlayerRow>('SELECT * FROM players WHERE email = ?', email);
}

// ═══════════════════════════════════════════════════════════════════
// Session helpers
// ═══════════════════════════════════════════════════════════════════

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
  return queryGet<SessionRow>('SELECT * FROM game_sessions WHERE id = ?', sessionId);
}

export function recordLevelComplete(sessionId: string, level: number, score: number): void {
  const completedAt = new Date().toISOString();
  const existing = queryGet<{ score: number }>('SELECT score FROM level_results WHERE session_id = ? AND level_number = ?', sessionId, level);
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
  const rows = queryAll<{ level_number: number }>('SELECT level_number FROM level_results WHERE session_id = ? AND completed = 1 ORDER BY level_number ASC', sessionId);
  return rows.map((row) => row.level_number);
}

export function completeSession(sessionId: string, score: number): void {
  db.prepare('UPDATE game_sessions SET status = ?, completed_at = ?, total_score = max(total_score, ?), highest_level = 3 WHERE id = ?')
    .run('COMPLETED', new Date().toISOString(), score, sessionId);
}

// ═══════════════════════════════════════════════════════════════════
// Coupon helpers
// ═══════════════════════════════════════════════════════════════════

export function getCouponForSession(sessionId: string): CouponRow | undefined {
  return queryGet<CouponRow>('SELECT * FROM coupons WHERE session_id = ?', sessionId);
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

<<<<<<< HEAD
// --- Event instance helpers ---

export function createEventInstance(mapId: string, createdBy?: string): EventInstanceRow {
=======
export function getCouponByCode(code: string): (CouponRow & { player_name: string | null }) | undefined {
  return queryGet<CouponRow & { player_name: string | null }>(`
    SELECT c.*, p.display_name AS player_name
    FROM coupons c
    JOIN players p ON p.id = c.player_id
    WHERE c.code = ?
  `, code);
}

export function redeemCoupon(couponId: string): void {
  db.prepare('UPDATE coupons SET status = ?, redeemed_at = ? WHERE id = ?')
    .run('REDEEMED', new Date().toISOString(), couponId);
}

// ═══════════════════════════════════════════════════════════════════
// Event Instance helpers
// ═══════════════════════════════════════════════════════════════════

export function createInstance(mapId: string, createdBy?: string): EventInstanceRow {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  const instance: EventInstanceRow = {
    id: randomUUID(),
    map_id: mapId,
    status: 'WAITING',
    created_by: createdBy ?? null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
  };
  db.prepare('INSERT INTO event_instances (id, map_id, status, created_by, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(instance.id, instance.map_id, instance.status, instance.created_by, instance.created_at);
  return instance;
}

<<<<<<< HEAD
export function getEventInstance(instanceId: string): EventInstanceRow | undefined {
  return db.prepare('SELECT * FROM event_instances WHERE id = ?').get(instanceId) as EventInstanceRow | undefined;
}

export function updateInstanceStatus(instanceId: string, status: string): void {
  const updates: string[] = ['status = ?'];
  const params: unknown[] = [status];
  if (status === 'IN_PLAY') {
    updates.push('started_at = ?');
    params.push(new Date().toISOString());
  } else if (status === 'FINISHED') {
    updates.push('finished_at = ?');
    params.push(new Date().toISOString());
  }
  params.push(instanceId);
  db.prepare(`UPDATE event_instances SET ${updates.join(', ')} WHERE id = ?`).run(...(params as [string, string, string]));
}

export function registerPlayerForInstance(
  instanceId: string, playerId: string, sessionId: string,
  characterType: string, mapId: string,
=======
export function updateInstanceStatus(instanceId: string, status: EventInstanceRow['status']): void {
  const fields: string[] = ['status = ?'];
  const values: any[] = [status];
  if (status === 'IN_PROGRESS') {
    fields.push('started_at = ?');
    values.push(new Date().toISOString());
  } else if (status === 'FINISHED') {
    fields.push('finished_at = ?');
    values.push(new Date().toISOString());
  }
  values.push(instanceId);
  db.prepare(`UPDATE event_instances SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function getInstance(instanceId: string): EventInstanceRow | undefined {
  return queryGet<EventInstanceRow>('SELECT * FROM event_instances WHERE id = ?', instanceId);
}

export function getActiveInstance(): EventInstanceRow | undefined {
  return queryGet<EventInstanceRow>("SELECT * FROM event_instances WHERE status IN ('WAITING', 'IN_PROGRESS') ORDER BY created_at DESC LIMIT 1");
}

export function listInstances(): EventInstanceRow[] {
  return queryAll<EventInstanceRow>('SELECT * FROM event_instances ORDER BY created_at DESC LIMIT 20');
}

// ═══════════════════════════════════════════════════════════════════
// Instance Player helpers
// ═══════════════════════════════════════════════════════════════════

export function registerPlayerForInstance(
  instanceId: string,
  playerId: string,
  sessionId: string,
  characterType: string,
  mapId: string,
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
): InstancePlayerRow {
  const row: InstancePlayerRow = {
    id: randomUUID(),
    instance_id: instanceId,
    player_id: playerId,
    session_id: sessionId,
    character_type: characterType,
    map_id: mapId,
    status: 'REGISTERED',
    score: 0,
    completion_time: null,
    completed_at: null,
  };
<<<<<<< HEAD
  db.prepare(`INSERT OR IGNORE INTO instance_players (id, instance_id, player_id, session_id, character_type, map_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(row.id, row.instance_id, row.player_id, row.session_id, row.character_type, row.map_id, row.status);
=======
  db.prepare(`
    INSERT OR IGNORE INTO instance_players (id, instance_id, player_id, session_id, character_type, map_id, status, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(row.id, row.instance_id, row.player_id, row.session_id, row.character_type, row.map_id, row.status, row.score);
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  return row;
}

export function updateInstancePlayerStatus(
<<<<<<< HEAD
  instanceId: string, playerId: string,
  status: string, score?: number, completionTime?: number,
): void {
  if (score != null && completionTime != null) {
    db.prepare('UPDATE instance_players SET status = ?, score = ?, completion_time = ?, completed_at = ? WHERE instance_id = ? AND player_id = ?')
      .run(status, score, completionTime, new Date().toISOString(), instanceId, playerId);
  } else {
    db.prepare('UPDATE instance_players SET status = ? WHERE instance_id = ? AND player_id = ?')
      .run(status, instanceId, playerId);
  }
}

export function getInstancePlayers(instanceId: string): InstancePlayerRow[] {
  return db.prepare('SELECT * FROM instance_players WHERE instance_id = ?').all(instanceId) as unknown as InstancePlayerRow[];
}

export function getInstancePlayersWithNames(instanceId: string): Array<InstancePlayerRow & { display_name: string | null }> {
  return db.prepare(`
    SELECT ip.*, p.display_name
    FROM instance_players ip
    JOIN players p ON p.id = ip.player_id
    WHERE ip.instance_id = ?
  `).all(instanceId) as unknown as Array<InstancePlayerRow & { display_name: string | null }>;
}

export function insertLeaderboardEntry(
  instanceId: string, playerId: string, rank: number,
  score: number, completionTime: number | null, rewardType?: string, couponId?: string,
): LeaderboardRow {
  const row: LeaderboardRow = {
=======
  instanceId: string,
  playerId: string,
  status: InstancePlayerRow['status'],
  score?: number,
  completionTime?: number,
): void {
  const fields: string[] = ['status = ?'];
  const values: any[] = [status];
  if (score !== undefined) {
    fields.push('score = ?');
    values.push(score);
  }
  if (completionTime !== undefined) {
    fields.push('completion_time = ?');
    values.push(completionTime);
  }
  if (status === 'COMPLETED') {
    fields.push('completed_at = ?');
    values.push(new Date().toISOString());
  }
  values.push(instanceId, playerId);
  db.prepare(`UPDATE instance_players SET ${fields.join(', ')} WHERE instance_id = ? AND player_id = ?`).run(...values);
}

export function getInstancePlayers(instanceId: string): InstancePlayerRow[] {
  return queryAll<InstancePlayerRow>('SELECT * FROM instance_players WHERE instance_id = ?', instanceId);
}

export function getCompletedInstancePlayers(instanceId: string): InstancePlayerRow[] {
  return queryAll<InstancePlayerRow>("SELECT * FROM instance_players WHERE instance_id = ? AND status = 'COMPLETED' ORDER BY completion_time ASC, score DESC", instanceId);
}

// ═══════════════════════════════════════════════════════════════════
// Leaderboard helpers
// ═══════════════════════════════════════════════════════════════════

export function insertLeaderboardEntry(
  instanceId: string,
  playerId: string,
  rank: number,
  score: number,
  completionTime: number | null,
  rewardType: string | null,
  couponId: string | null,
): LeaderboardRow {
  const entry: LeaderboardRow = {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    id: randomUUID(),
    instance_id: instanceId,
    player_id: playerId,
    rank,
    score,
    completion_time: completionTime,
<<<<<<< HEAD
    reward_type: rewardType ?? null,
    coupon_id: couponId ?? null,
  };
  db.prepare('INSERT INTO leaderboard (id, instance_id, player_id, rank, score, completion_time, reward_type, coupon_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(row.id, row.instance_id, row.player_id, row.rank, row.score, row.completion_time, row.reward_type, row.coupon_id);
  return row;
}

export function getLeaderboard(instanceId: string): LeaderboardRow[] {
  return db.prepare('SELECT * FROM leaderboard WHERE instance_id = ? ORDER BY rank ASC').all(instanceId) as unknown as LeaderboardRow[];
}

// --- Vendor helpers ---

export function getVendorByUsername(username: string): VendorRow | undefined {
  return db.prepare('SELECT * FROM vendors WHERE username = ?').get(username) as VendorRow | undefined;
}

export function createVendorSession(vendorId: string, token: string, expiresAt: string): VendorSessionRow {
  const row: VendorSessionRow = {
=======
    reward_type: rewardType,
    coupon_id: couponId,
  };
  db.prepare(`
    INSERT INTO leaderboard (id, instance_id, player_id, rank, score, completion_time, reward_type, coupon_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(entry.id, entry.instance_id, entry.player_id, entry.rank, entry.score, entry.completion_time, entry.reward_type, entry.coupon_id);
  return entry;
}

export function getLeaderboard(instanceId: string): (LeaderboardRow & { display_name: string | null })[] {
  return queryAll<LeaderboardRow & { display_name: string | null }>(`
    SELECT l.*, p.display_name
    FROM leaderboard l
    JOIN players p ON p.id = l.player_id
    WHERE l.instance_id = ?
    ORDER BY l.rank ASC
  `, instanceId);
}

// ═══════════════════════════════════════════════════════════════════
// Vendor helpers
// ═══════════════════════════════════════════════════════════════════

export function createVendor(username: string, passwordHash: string, locationName: string): VendorRow {
  const vendor: VendorRow = {
    id: randomUUID(),
    username,
    password_hash: passwordHash,
    location_name: locationName,
    created_at: new Date().toISOString(),
  };
  db.prepare('INSERT INTO vendors (id, username, password_hash, location_name, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(vendor.id, vendor.username, vendor.password_hash, vendor.location_name, vendor.created_at);
  return vendor;
}

export function getVendorByUsername(username: string): VendorRow | undefined {
  return queryGet<VendorRow>('SELECT * FROM vendors WHERE username = ?', username);
}

export function createVendorSession(vendorId: string, token: string, expiresAt: string): VendorSessionRow {
  const session: VendorSessionRow = {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    id: randomUUID(),
    vendor_id: vendorId,
    token,
    expires_at: expiresAt,
  };
  db.prepare('INSERT INTO vendor_sessions (id, vendor_id, token, expires_at) VALUES (?, ?, ?, ?)')
<<<<<<< HEAD
    .run(row.id, row.vendor_id, row.token, row.expires_at);
  return row;
}

export function getVendorByToken(token: string): VendorRow | undefined {
  const session = db.prepare(`
    SELECT v.* FROM vendors v
    JOIN vendor_sessions vs ON vs.vendor_id = v.id
    WHERE vs.token = ? AND vs.expires_at > datetime('now')
  `).get(token) as VendorRow | undefined;
  return session;
}

export function getCouponByCode(code: string): CouponRow | undefined {
  return db.prepare(`
    SELECT c.*, p.display_name, p.email
    FROM coupons c
    JOIN players p ON p.id = c.player_id
    WHERE c.code = ?
  `).get(code) as (CouponRow & { display_name?: string; email?: string }) | undefined;
}

export function redeemCoupon(couponId: string): void {
  db.prepare('UPDATE coupons SET status = ?, redeemed_at = ? WHERE id = ?')
    .run('REDEEMED', new Date().toISOString(), couponId);
=======
    .run(session.id, session.vendor_id, session.token, session.expires_at);
  return session;
}

export function getVendorByToken(token: string): (VendorRow & { expires_at: string }) | undefined {
  return queryGet<VendorRow & { expires_at: string }>(`
    SELECT v.*, vs.expires_at
    FROM vendor_sessions vs
    JOIN vendors v ON v.id = vs.vendor_id
    WHERE vs.token = ?
  `, token);
}

export function deleteVendorSession(token: string): void {
  db.prepare('DELETE FROM vendor_sessions WHERE token = ?').run(token);
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
}
