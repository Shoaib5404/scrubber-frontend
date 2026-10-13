'use client';

import { useEffect } from 'react';
import { tokenManager } from '@/lib/auth/token-manager';
import type { AuthUser } from '../types';
import { useAuthStore } from '../store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const clear = useAuthStore((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onExpired = () => clear();
    window.addEventListener('scrubber:auth-expired', onExpired);
    return () => window.removeEventListener('scrubber:auth-expired', onExpired);
  }, [clear]);

  useEffect(() => {
    const onRefreshed = (event: Event) => {
      const user = (event as CustomEvent<AuthUser>).detail;
      const access = tokenManager.getAccessToken();
      const refresh = tokenManager.getRefreshToken();
      if (user && access && refresh) {
        setSession(access, refresh, user);
      }
    };
    window.addEventListener('scrubber:auth-refreshed', onRefreshed);
    return () => window.removeEventListener('scrubber:auth-refreshed', onRefreshed);
  }, [setSession]);

  return <>{children}</>;
}
