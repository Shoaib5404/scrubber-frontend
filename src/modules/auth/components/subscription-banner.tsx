'use client';

import { useAuthStore } from '../store/auth-store';
import { SUBSCRIPTION_INACTIVE_MESSAGE, isStaffRole } from '../types';

export function SubscriptionBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user || isStaffRole(user.role) || user.subscription_active !== false) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
      {SUBSCRIPTION_INACTIVE_MESSAGE}
    </div>
  );
}
