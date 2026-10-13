'use client';

import Link from 'next/link';
import { useState } from 'react';
import { canUploadOrValidate, useAuthStore } from '@/modules/auth';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';

export default function CustomerHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useAuthStore((s) => s.user);
  const canUpload = canUploadOrValidate(user);

  return (
    <AppShell title="Customer portal" basePath="/portal">
      <div className="space-y-8">
        <Link
          href="/portal/integrations"
          className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="font-medium text-slate-900">Integrations</span>
          <span className="mt-1 block text-xs text-slate-600">
            View your API Client ID and rotate your client secret.
          </span>
        </Link>
        {canUpload ? (
          <BatchUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
        ) : null}
        <BatchList basePath="/portal" refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
