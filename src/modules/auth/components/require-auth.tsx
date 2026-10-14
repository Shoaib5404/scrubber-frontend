'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import { AUTH_REASON_STORAGE_KEY, isStaffRole } from '../types';

function loginPathWithAuthReason(): string {
  if (typeof window === 'undefined') {
    return '/login';
  }
  try {
    const reason = sessionStorage.getItem(AUTH_REASON_STORAGE_KEY);
    if (reason === 'deactivated') {
      sessionStorage.removeItem(AUTH_REASON_STORAGE_KEY);
      return '/login?reason=deactivated';
    }
  } catch {
    // ignore storage failures
  }
  return '/login';
}

type RequireAuthProps = {
  children: React.ReactNode;
  /** When set, non-matching roles are redirected to their home. */
  staffOnly?: boolean;
  customerOnly?: boolean;
  /** Skip email-verification soft gate (verify / confirm password pages). */
  allowUnverified?: boolean;
};

function emailVerificationRequired(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED === 'true';
}

/**
 * Fail-closed gate: unknown → wait; anonymous → /login; wrong role → role home.
 * Optional soft gate: unverified email → /verify-email when env flag is set.
 */
export function RequireAuth({
  children,
  staffOnly,
  customerOnly,
  allowUnverified,
}: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === 'unknown') {
      return;
    }
    if (status === 'anonymous' || !user) {
      router.replace(loginPathWithAuthReason());
      return;
    }
    if (
      !allowUnverified &&
      emailVerificationRequired() &&
      !user.email_verified &&
      pathname !== '/verify-email'
    ) {
      router.replace('/verify-email');
      return;
    }
    if (staffOnly && !isStaffRole(user.role)) {
      router.replace('/portal');
      return;
    }
    if (customerOnly && isStaffRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [status, user, staffOnly, customerOnly, allowUnverified, pathname, router]);

  if (status === 'unknown') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground" role="status">
        Checking session…
      </div>
    );
  }

  if (status === 'anonymous' || !user) {
    return null;
  }

  if (
    !allowUnverified &&
    emailVerificationRequired() &&
    !user.email_verified &&
    pathname !== '/verify-email'
  ) {
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
