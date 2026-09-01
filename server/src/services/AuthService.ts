import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  createVendor,
  createVendorSession,
  deleteVendorSession,
  getVendorByUsername,
  getVendorByToken,
} from '../storage/database.js';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const BCRYPT_ROUNDS = 10;

export class AuthService {
  // ── Player session tokens ─────────────────────────────────────

  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ── Vendor authentication ─────────────────────────────────────

  async createVendor(
    username: string,
    password: string,
    locationName: string,
  ): Promise<{ vendorId: string; token: string }> {
    const existing = getVendorByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const vendor = createVendor(username, passwordHash, locationName);

    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();
    createVendorSession(vendor.id, token, expiresAt);

    return { vendorId: vendor.id, token };
  }

  async authenticateVendor(
    username: string,
    password: string,
  ): Promise<{ vendorId: string; token: string; locationName: string }> {
    const vendor = getVendorByUsername(username);
    if (!vendor) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, vendor.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();
    createVendorSession(vendor.id, token, expiresAt);

    return { vendorId: vendor.id, token, locationName: vendor.location_name };
  }

  validateVendorToken(
    token: string,
  ): { vendorId: string; username: string; locationName: string } | null {
    const vendor = getVendorByToken(token);
    if (!vendor) return null;

    // Check expiry
    if (new Date(vendor.expires_at) < new Date()) {
      deleteVendorSession(token);
      return null;
    }

    return {
      vendorId: vendor.id,
      username: vendor.username,
      locationName: vendor.location_name,
    };
  }

  logoutVendor(token: string): void {
    deleteVendorSession(token);
  }
}

export const authService = new AuthService();
