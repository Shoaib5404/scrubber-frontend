'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';

const STAFF_TOOLS: Array<{
  href: string;
  label: string;
  blurb: string;
  permission?: string;
  superAdminOnly?: boolean;
}> = [
  {
    href: '/dashboard/references',
    label: 'References',
    blurb: 'Shared CRUD for all rule/code tables',
  },
  {
    href: '/search',
    label: 'Coding search',
    blurb: 'CPT / ICD lookup and CPT explorer',
  },
  {
    href: '/dashboard/tenants',
    label: 'Tenants',
    blurb: 'Organizations, invites, and subscriptions',
    permission: Permission.TenantsManage,
  },
  {
    href: '/dashboard/users',
    label: 'Users',
    blurb: 'Staff accounts and API clients',
    permission: Permission.UsersManage,
  },
  {
    href: '/dashboard/permissions',
    label: 'Permissions',
    blurb: 'Role permission matrix',
    superAdminOnly: true,
  },
  {
    href: '/dashboard/upload-logs',
    label: 'Upload logs',
    blurb: 'EDI upload failures and history',
  },
];

export default function StaffHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useAuthStore((s) => s.user);
  const tools = useMemo(
    () =>
      STAFF_TOOLS.filter((tool) => {
        if (tool.superAdminOnly) {
          return user?.role === 'super_admin';
        }
        if (tool.permission) {
          return hasPermission(user, tool.permission);
        }
        return true;
      }),
    [user],
  );

  return (
    <AppShell title="Staff dashboard" basePath="/dashboard">
      <div className="space-y-8">
        <section aria-labelledby="staff-tools-heading" className="space-y-3">
          <div>
            <h2 id="staff-tools-heading" className="text-base font-semibold text-slate-900">
              Staff tools
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Condensed Next admin: batches and claims here; reference data, users, and coding
              tools via the links below.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="staff-tools">
            {tools.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="block rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{tool.label}</span>
                  <span className="mt-1 block text-xs text-slate-600">{tool.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <BatchUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
        <BatchList basePath="/dashboard" refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
