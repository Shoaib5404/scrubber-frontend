'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';

const STAFF_TOOLS: Array<{ href: string; label: string; blurb: string }> = [
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
    href: '/dashboard/users',
    label: 'Users',
    blurb: 'Staff accounts and API clients',
  },
  {
    href: '/dashboard/upload-logs',
    label: 'Upload logs',
    blurb: 'EDI upload failures and history',
  },
];

export default function StaffHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

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
              tools via the links below — not one Blade page per Laravel route.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="staff-tools">
            {STAFF_TOOLS.map((tool) => (
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
