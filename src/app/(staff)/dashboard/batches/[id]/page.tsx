'use client';

import { use } from 'react';
import { AppShell, BatchDetail } from '@/modules/batches';

export default function StaffBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const batchId = Number(id);

  return (
    <AppShell title="Batch detail" basePath="/dashboard">
      <BatchDetail batchId={batchId} basePath="/dashboard" />
    </AppShell>
  );
}
