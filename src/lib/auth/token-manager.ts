let accessToken: string | null = null;
let refreshToken: string | null = null;

const REFRESH_KEY = 'scrubber.refreshToken';

export const tokenManager = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  getRefreshToken(): string | null {
    if (refreshToken) {
      return refreshToken;
    }
    if (typeof window === 'undefined') {
      return null;
    }
    refreshToken = window.localStorage.getItem(REFRESH_KEY);
    return refreshToken;
  },

  setRefreshToken(token: string | null): void {
    refreshToken = token;
    if (typeof window === 'undefined') {
      return;
    }
    if (token) {
      window.localStorage.setItem(REFRESH_KEY, token);
    } else {
      window.localStorage.removeItem(REFRESH_KEY);
    }
  },

  clear(): void {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(REFRESH_KEY);
    }
  },
};
