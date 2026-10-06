'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onExpired = () => clear();
    window.addEventListener('scrubber:auth-expired', onExpired);
    return () => window.removeEventListener('scrubber:auth-expired', onExpired);
  }, [clear]);

  return <>{children}</>;
}
