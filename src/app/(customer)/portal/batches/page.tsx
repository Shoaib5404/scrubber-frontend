'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { canUploadOrValidate, useAuthStore } from '@/modules/auth';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';
import { TableSkeleton } from '@/components/layout/table-skeleton';

export default function CustomerBatchesPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useAuthStore((s) => s.user);
  const canUpload = canUploadOrValidate(user);

  const onUploaded = useCallback(
    (batchId: number) => {
      setRefreshKey((k) => k + 1);
      router.push(`/portal/batches/${batchId}`);
    },
    [router],
  );

  return (
    <AppShell
      title="Batches"
      description="Upload EDI files and review claim validation results for your organization."
      basePath="/portal"
    >
      <div className="flex flex-col gap-6">
        {canUpload ? <BatchUpload onUploaded={onUploaded} /> : null}
        <Suspense fallback={<TableSkeleton rows={8} columns={5} />}>
          <BatchList basePath="/portal" refreshKey={refreshKey} />
        </Suspense>
      </div>
    </AppShell>
  );
}
