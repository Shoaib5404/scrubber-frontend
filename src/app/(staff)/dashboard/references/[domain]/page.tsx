'use client';

import { use } from 'react';
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
      <DomainRecords domainSlug={domain} />
    </AppShell>
  );
}
