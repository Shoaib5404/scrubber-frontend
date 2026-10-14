'use client';

import { Suspense, use } from 'react';
import { AppShell } from '@/modules/batches';
import { DomainRecords } from '@/modules/reference-admin';
import { TableSkeleton } from '@/components/layout/table-skeleton';

export default function ReferenceDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = use(params);

  return (
    <AppShell title="Reference data" basePath="/dashboard">
      <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
        <DomainRecords domainSlug={domain} />
      </Suspense>
    </AppShell>
  );
}
