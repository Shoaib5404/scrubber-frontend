'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/modules/batches/components/app-shell';
import { PermissionsMatrix, RequireAuth, useAuthStore } from '@/modules/auth';

export default function PermissionsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (user && user.role !== 'super_admin') {
    return null;
  }

  return (
    <RequireAuth staffOnly>
      <AppShell title="Permissions" basePath="/dashboard">
        <PermissionsMatrix />
      </AppShell>
    </RequireAuth>
  );
}
