export interface PlayerSession {
  playerId: string;
  sessionId: string;
  email: string;
  displayName?: string;
  currentLevel: number;
  completedLevels: number[];
  totalScore: number;
}

export interface CompletionResponse {
  couponCode?: string;
  rewardName: string;
  emailSent: boolean;
  alreadyIssued: boolean;
}

import { MapId } from '../data/MapTheme';
import { GameTask } from '../game/GameTask';

export interface GameInstanceResponse {
  instanceId: string;
  mapId: MapId;
  tasks: GameTask[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const ACCOUNTS_KEY = 'farmquest.accounts';

interface StoredAccount {
  email: string;
  displayName: string;
  playerId?: string;
}

export class FarmQuestApi {
  async registerPlayer(email: string, displayName?: string): Promise<PlayerSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const name = displayName?.trim() || undefined;
    const known = this.getAccounts().find((account) => account.email === normalizedEmail);
    try {
      const response = await this.post<{ playerId: string; sessionId: string }>('/players/register', {
        email: normalizedEmail,
        displayName: name,
      });
      const session = this.toSession(response, normalizedEmail, name);
      this.rememberAccount(normalizedEmail, name ?? 'Player', session.playerId);
      return session;
    } catch {
      const session = this.localSession(normalizedEmail, name, known?.playerId);
      this.rememberAccount(normalizedEmail, name ?? 'Player', session.playerId);
      return session;
    }
  }

  async loginPlayer(email: string): Promise<PlayerSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const known = this.getAccounts().find((account) => account.email === normalizedEmail);
    if (!known) {
      try {
        const response = await fetch(`${API_BASE}/players/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        if (response.status === 404 || response.status === 400) {
          throw new AccountNotFoundError();
        }
        if (!response.ok) throw new AccountNotFoundError();
        const payload = await response.json() as { playerId: string; sessionId: string; displayName?: string };
        this.rememberAccount(normalizedEmail, payload.displayName ?? 'Player', payload.playerId);
        return this.toSession(payload, normalizedEmail, payload.displayName);
      } catch (error) {
        if (error instanceof AccountNotFoundError) throw error;
        throw new AccountNotFoundError();
      }
    }

    return this.registerPlayer(normalizedEmail, known.displayName);
  }

  async startNewSession(playerId: string, email: string, displayName?: string): Promise<PlayerSession> {
    try {
      const response = await this.post<{ sessionId: string }>('/players/session', { playerId });
      return {
        playerId,
        sessionId: response.sessionId,
        email,
        displayName,
        currentLevel: 1,
        completedLevels: [],
        totalScore: 0,
      };
    } catch {
      return this.localSession(email, displayName, playerId);
    }
  }

  async completeLevel(sessionId: string, level: number, score: number): Promise<void> {
    await this.post('/game/level-complete', { sessionId, level, score });
  }


  private localSession(email: string, displayName?: string, playerId?: string): PlayerSession {
    return {
      playerId: playerId ?? crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      email,
      displayName,
      currentLevel: 1,
      completedLevels: [],
      totalScore: 0,
    };
  }

  private toSession(
    response: { playerId: string; sessionId: string },
    email: string,
    displayName?: string,
  ): PlayerSession {
    return {
      ...response,
      email,
      displayName,
      currentLevel: 1,
      completedLevels: [],
      totalScore: 0,
    };
  }

  private rememberAccount(email: string, displayName: string, playerId?: string): void {
    const accounts = this.getAccounts().filter((account) => account.email !== email);
    accounts.push({ email, displayName, playerId });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  async startInstance(sessionId: string, mapId: MapId): Promise<GameInstanceResponse> {
    return this.post<GameInstanceResponse>('/game/instance', { sessionId, mapId });
  }

  async completeGame(sessionId: string, score: number, completionTime?: number): Promise<CompletionResponse> {
    return this.post<CompletionResponse>('/game/complete', { sessionId, score, completionTime });
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('FarmQuest API request failed');
    }

    return response.json() as Promise<T>;
  }
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
