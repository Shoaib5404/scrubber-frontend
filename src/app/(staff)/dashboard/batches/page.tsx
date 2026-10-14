'use client';

import { Suspense, useCallback, useState } from 'react';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';
import { TableSkeleton } from '@/components/layout/table-skeleton';

export default function StaffBatchesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const onUploaded = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AppShell
      title="Batches"
      description="Upload EDI files, monitor processing, and open claims for review."
      basePath="/dashboard"
    >
      <div className="flex flex-col gap-6">
        <BatchUpload onUploaded={onUploaded} />
        <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
          <BatchList
            basePath="/dashboard"
            refreshKey={refreshKey}
            showTenantFilter
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
