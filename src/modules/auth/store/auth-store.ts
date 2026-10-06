import { create } from 'zustand';
import { tokenManager } from '@/lib/auth/token-manager';

export type AuthStatus = 'anonymous' | 'authenticated' | 'unknown';

type AuthState = {
  status: AuthStatus;
  setAuthenticated: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  setAuthenticated: (accessToken, refreshToken) => {
    tokenManager.setAccessToken(accessToken);
    tokenManager.setRefreshToken(refreshToken);
    set({ status: 'authenticated' });
  },
  clear: () => {
    tokenManager.clear();
    set({ status: 'anonymous' });
  },
}));
