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
  private getAccounts(): StoredAccount[] {
    try {
      const stored = localStorage.getItem(ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async registerPlayer(email: string, displayName: string): Promise<PlayerSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const name = displayName.trim();
    try {
      const response = await this.post<{ playerId: string; sessionId: string; displayName?: string }>('/players/register', {
        email: normalizedEmail,
        displayName: name,
      });
      const session = this.toSession(response, normalizedEmail);
      this.rememberAccount(normalizedEmail, session.displayName ?? 'Player', session.playerId);
      return session;
    } catch (error) {
      // Fallback to local session for development if API is down
      const known = this.getAccounts().find((account) => account.email === normalizedEmail);
      const session = this.localSession(normalizedEmail, name || known?.displayName, known?.playerId);
      this.rememberAccount(normalizedEmail, session.displayName ?? 'Player', session.playerId);
      return session;
    }
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
    response: { playerId: string; sessionId: string; displayName?: string },
    email: string,
  ): PlayerSession {
    return {
      ...response,
      email,
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
