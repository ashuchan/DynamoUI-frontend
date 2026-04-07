// Narrow wrapper over localStorage so the auth token is read/written in one
// place. Tests can monkey-patch ``tokenStorage`` directly without touching
// every consumer.
import type { AuthResponse } from './types';

const TOKEN_KEY = 'dui.auth.token';
const SNAPSHOT_KEY = 'dui.auth.snapshot';

export interface AuthSnapshot {
  user: AuthResponse['user'];
  tenant: AuthResponse['tenant'];
  tenants: AuthResponse['tenants'];
  expires_at: number; // epoch seconds
}

export const tokenStorage = {
  read(): { token: string; snapshot: AuthSnapshot } | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const snapshotRaw = localStorage.getItem(SNAPSHOT_KEY);
      if (!token || !snapshotRaw) return null;
      const snapshot = JSON.parse(snapshotRaw) as AuthSnapshot;
      // Drop expired entries so the UI never boots in a stale session.
      if (snapshot.expires_at * 1000 < Date.now()) {
        tokenStorage.clear();
        return null;
      }
      return { token, snapshot };
    } catch {
      return null;
    }
  },

  write(response: AuthResponse): void {
    const snapshot: AuthSnapshot = {
      user: response.user,
      tenant: response.tenant,
      tenants: response.tenants,
      expires_at: Math.floor(Date.now() / 1000) + response.expires_in,
    };
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SNAPSHOT_KEY);
  },
};

// Singleton in-memory reference used by the api client to attach the
// Authorization header without forcing every call to read localStorage.
let currentToken: string | null = null;

export function setCurrentToken(token: string | null): void {
  currentToken = token;
}

export function getCurrentToken(): string | null {
  return currentToken;
}
