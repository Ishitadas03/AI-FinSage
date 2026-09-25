/**
 * Centralized Token Storage Module
 * Manages access tokens in memory and refresh tokens in sessionStorage.
 * Never stores raw refresh tokens in localStorage.
 */

const REFRESH_TOKEN_KEY = 'finsage_rt_sess';
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  getRefreshToken(): string | null {
    if (inMemoryRefreshToken) {
      return inMemoryRefreshToken;
    }
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    inMemoryRefreshToken = token;
    try {
      if (token) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      // Storage unavailable (e.g., incognito or restricted environment)
    }
  },

  setTokens(accessToken: string, refreshToken?: string): void {
    this.setAccessToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  },

  clearTokens(): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore storage errors on cleanup
    }
  },

  hasSession(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken());
  },
};
