'use client';

import { Suspense, use } from 'react';
import { AppShell } from '@/modules/batches';
import { DomainRecords } from '@/modules/reference-admin';

export default function ReferenceDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = use(params);

  return (
    <AppShell title="Reference data" basePath="/dashboard">
      <Suspense fallback={<p className="text-sm text-slate-600">Loading…</p>}>
        <DomainRecords domainSlug={domain} />
      </Suspense>
    </AppShell>
  );
}
