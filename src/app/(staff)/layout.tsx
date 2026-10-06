'use client';

import { RequireAuth } from '@/modules/auth';

export default function StaffLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth staffOnly>
      <div className="min-h-screen">{children}</div>
    </RequireAuth>
  );
}
