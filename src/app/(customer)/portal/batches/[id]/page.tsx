'use client';

import { use } from 'react';
import { AppShell, BatchDetail } from '@/modules/batches';

export default function CustomerBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const batchId = Number(id);

  return (
    <AppShell title="Batch detail" basePath="/portal">
      <BatchDetail batchId={batchId} basePath="/portal" />
    </AppShell>
  );
}
