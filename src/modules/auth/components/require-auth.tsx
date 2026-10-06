'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import { isStaffRole } from '../types';

type RequireAuthProps = {
  children: React.ReactNode;
  /** When set, non-matching roles are redirected to their home. */
  staffOnly?: boolean;
  customerOnly?: boolean;
};

/**
 * Fail-closed gate: unknown → wait; anonymous → /login; wrong role → role home.
 */
export function RequireAuth({ children, staffOnly, customerOnly }: RequireAuthProps) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === 'unknown') {
      return;
    }
    if (status === 'anonymous' || !user) {
      router.replace('/login');
      return;
    }
    if (staffOnly && !isStaffRole(user.role)) {
      router.replace('/portal');
      return;
    }
    if (customerOnly && isStaffRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [status, user, staffOnly, customerOnly, router]);

  if (status === 'unknown') {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600" role="status">
        Checking session…
      </div>
    );
  }

  if (status === 'anonymous' || !user) {
    return null;
  }

  if (staffOnly && !isStaffRole(user.role)) {
    return null;
  }

  if (customerOnly && isStaffRole(user.role)) {
    return null;
  }

  return <>{children}</>;
}
