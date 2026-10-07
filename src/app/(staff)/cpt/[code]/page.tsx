'use client';

import { use } from 'react';
import { AppShell } from '@/modules/batches';
import { CptDetailView } from '@/modules/coding-reference/components/cpt-detail-view';

export default function CptCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return (
    <AppShell title="CPT explorer" basePath="/dashboard">
      <CptDetailView code={decodeURIComponent(code)} />
    </AppShell>
  );
}
