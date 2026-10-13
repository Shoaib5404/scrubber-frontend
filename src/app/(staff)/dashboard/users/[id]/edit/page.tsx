'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import { ApiClientError } from '@/lib/api/errors';
import { UserForm, getUser, type AdminUser } from '@/modules/users-admin';

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(params.id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getUser(userId)
      .then((row) => {
        if (cancelled) return;
        if (row.role === 'super_admin') {
          router.replace('/dashboard/users');
          return;
        }
        setUser(row);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.title ?? err.message
              : 'Failed to load user.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  return (
    <RequireAuth staffOnly>
      <AppShell title="Edit user" basePath="/dashboard">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!error && !user ? <p className="text-sm text-slate-600">Loading…</p> : null}
        {user ? <UserForm mode="edit" user={user} /> : null}
      </AppShell>
    </RequireAuth>
  );
}
