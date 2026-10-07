'use client';

import { useState } from 'react';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';

export default function CustomerHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell title="Customer portal" basePath="/portal">
      <div className="space-y-8">
        <BatchUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
        <BatchList basePath="/portal" refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
