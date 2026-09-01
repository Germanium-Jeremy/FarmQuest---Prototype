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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class FarmQuestApi {
  async registerPlayer(email: string, displayName?: string): Promise<PlayerSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const response = await this.post<{ playerId: string; sessionId: string }>('/players/register', {
      email: normalizedEmail,
      displayName: displayName?.trim() || undefined,
    });
    return {
      ...response,
      email: normalizedEmail,
      displayName: displayName?.trim() || undefined,
      currentLevel: 1,
      completedLevels: [],
      totalScore: 0,
    };
  }

  async startNewSession(playerId: string, email: string, displayName?: string): Promise<PlayerSession> {
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
  }

  async completeLevel(sessionId: string, level: number, score: number): Promise<void> {
    await this.post('/game/level-complete', { sessionId, level, score });
  }

  async completeGame(sessionId: string, score: number): Promise<CompletionResponse> {
    return this.post<CompletionResponse>('/game/complete', { sessionId, score });
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
