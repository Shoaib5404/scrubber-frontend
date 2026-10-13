'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import { listTenants, type AdminTenant } from '@/modules/tenants-admin';

export default function TenantsAdminPage() {
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.TenantsManage);
  const [rows, setRows] = useState<AdminTenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!canManage) return;
    void listTenants(page)
      .then((data) => {
        setRows(data.data);
        setLastPage(data.last_page);
      })
      .catch((err: Error) => setError(err.message));
  }, [canManage, page]);

  if (!canManage) {
    return (
      <AppShell title="Tenants" basePath="/dashboard">
        <p className="text-sm text-slate-600">You do not have permission to manage tenants.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tenants" basePath="/dashboard">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Organizations and member invites.</p>
        <Link
          href="/dashboard/tenants/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New tenant
        </Link>
      </div>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Features</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Batches</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-900">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.slug}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{t.status}</td>
                <td className="px-4 py-3 text-slate-700">{t.subscription_status}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {(t.features ?? []).length > 0 ? (t.features ?? []).join(', ') : '—'}
                </td>
                <td className="px-4 py-3 text-slate-700">{t.users_count ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{t.batches_count ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/tenants/${t.id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2 py-1 text-sm text-slate-600">
          Page {page} of {lastPage}
        </span>
        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </AppShell>
  );
}
