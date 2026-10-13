import { create } from 'zustand';
import { tokenManager } from '@/lib/auth/token-manager';
import { loginRequest, logoutRequest, refreshRequest } from '../api';
import type { AuthUser } from '../types';
import { homePathForRole } from '../types';

export type AuthStatus = 'anonymous' | 'authenticated' | 'unknown';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  patchUser: (patch: Partial<AuthUser>) => void;
  clear: () => void;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const USER_KEY = 'scrubber.authUser';

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(USER_KEY);
    return;
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,

  setSession: (accessToken, refreshToken, user) => {
    tokenManager.setAccessToken(accessToken);
    tokenManager.setRefreshToken(refreshToken);
    writeStoredUser(user);
    set({ status: 'authenticated', user });
  },

  patchUser: (patch) => {
    const current = get().user;
    if (!current) {
      return;
    }
    const next = { ...current, ...patch };
    writeStoredUser(next);
    set({ user: next });
  },

  clear: () => {
    tokenManager.clear();
    writeStoredUser(null);
    set({ status: 'anonymous', user: null });
  },

  login: async (email, password) => {
    const session = await loginRequest(email, password);
    get().setSession(session.accessToken, session.refreshToken, session.user);
    return homePathForRole(session.user.role);
  },

  logout: async () => {
    const refresh = tokenManager.getRefreshToken();
    try {
      if (refresh) {
        await logoutRequest(refresh);
      }
    } catch {
      // fail closed locally even if API logout fails
    }
    get().clear();
  },

  hydrate: async () => {
    const refresh = tokenManager.getRefreshToken();
    const storedUser = readStoredUser();
    if (!refresh) {
      get().clear();
      return;
    }
    try {
      const session = await refreshRequest(refresh);
      get().setSession(session.accessToken, session.refreshToken, session.user);
    } catch {
      get().clear();
      if (storedUser) {
        writeStoredUser(null);
      }
    }
  },
}));
