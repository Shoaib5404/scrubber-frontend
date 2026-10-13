'use client';

import { useParams } from 'next/navigation';
import { AppShell, EdiViewer } from '@/modules/batches';

export default function CustomerBatchEdiPage() {
  const params = useParams<{ id: string }>();
  const batchId = Number(params.id);

  return (
    <AppShell title="EDI viewer" basePath="/portal">
      <EdiViewer batchId={batchId} basePath="/portal" />
    </AppShell>
  );
}
