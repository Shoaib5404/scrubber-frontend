'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { Permission, RequireAuth, hasPermission, useAuthStore } from '@/modules/auth';
import { listUsers, type AdminUser } from '@/modules/users-admin';

export default function UsersAdminPage() {
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.UsersManage);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void listUsers(page)
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setLastPage(result.last_page);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load users');
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <RequireAuth staffOnly>
      <AppShell title="Users" basePath="/dashboard">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Create and edit Admin, User, and Customer accounts
            {canManage ? '' : ' (view may be limited by permissions)'}.
          </p>
          {canManage ? (
            <Link
              href="/dashboard/users/new"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create user
            </Link>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm" data-testid="users-admin-table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Subscription</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => {
                const protectedUser = u.role === 'super_admin';
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-700">{u.email}</td>
                    <td className="px-4 py-3 text-slate-700">{u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                        data-testid={`user-active-${u.id}`}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.plan ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{u.subscription_status}</td>
                    <td className="px-4 py-3">
                      {protectedUser ? (
                        <span className="text-xs font-medium text-slate-500">Protected</span>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <Link
                            className="font-medium text-slate-800 underline-offset-2 hover:underline"
                            href={`/dashboard/users/${u.id}/edit`}
                          >
                            Edit
                          </Link>
                          {u.role === 'customer' ? (
                            <Link
                              className="font-medium text-slate-800 underline-offset-2 hover:underline"
                              href={`/dashboard/users/${u.id}/api-clients`}
                            >
                              API clients
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lastPage > 1 ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
