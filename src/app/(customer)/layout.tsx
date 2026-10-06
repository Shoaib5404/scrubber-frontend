'use client';

import { RequireAuth } from '@/modules/auth';

export default function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth customerOnly>
      <div className="min-h-screen">{children}</div>
    </RequireAuth>
  );
}
