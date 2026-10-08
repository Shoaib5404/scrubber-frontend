'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import { listUsers, type AdminUser } from '@/modules/users-admin/api';

export default function UsersAdminPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listUsers()
      .then((page) => {
        if (!cancelled) setRows(page.data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load users');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RequireAuth staffOnly>
      <AppShell title="Users" basePath="/dashboard">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <table className="mt-4 w-full text-left text-sm" data-testid="users-admin-table">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="py-2 pr-3">{u.name}</td>
                <td className="py-2 pr-3">{u.email}</td>
                <td className="py-2 pr-3">{u.role}</td>
                <td className="py-2">
                  <Link
                    className="text-sky-700 underline"
                    href={`/dashboard/users/${u.id}/api-clients`}
                  >
                    API clients
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppShell>
    </RequireAuth>
  );
}
