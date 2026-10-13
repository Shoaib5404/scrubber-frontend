'use client';

import { useParams } from 'next/navigation';
import { AppShell, EdiViewer } from '@/modules/batches';

export default function StaffBatchEdiPage() {
  const params = useParams<{ id: string }>();
  const batchId = Number(params.id);

  return (
    <AppShell title="EDI viewer" basePath="/dashboard">
      <EdiViewer batchId={batchId} basePath="/dashboard" />
    </AppShell>
  );
}
