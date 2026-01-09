/**
 * In-memory + sessionStorage token store
 * - Keeps token out of localStorage to narrow exposure window
 * - Expires tokens proactively to limit replay surface
 */

const TOKEN_KEY = "auth_token";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

let inMemoryToken: string | null = null;
let expiresAt: number | null = null;

export function setAuthToken(token: string, ttlMs: number = DEFAULT_TTL_MS) {
  inMemoryToken = token;
  expiresAt = Date.now() + ttlMs;
  try {
    sessionStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ token, expiresAt })
    );
  } catch {
    // ignore quota errors
  }
}

export function clearAuthToken() {
  inMemoryToken = null;
  expiresAt = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getAuthToken(): string | null {
  if (inMemoryToken && expiresAt && expiresAt > Date.now()) {
    return inMemoryToken;
  }

  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; expiresAt?: number };
    if (!parsed.token) return null;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      clearAuthToken();
      return null;
    }
    inMemoryToken = parsed.token;
    expiresAt = parsed.expiresAt ?? null;
    return inMemoryToken;
  } catch {
    clearAuthToken();
    return null;
  }
}
