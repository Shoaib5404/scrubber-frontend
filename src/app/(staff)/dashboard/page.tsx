'use client';

import { useState } from 'react';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';

export default function StaffHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell title="Staff dashboard" basePath="/dashboard">
      <div className="space-y-8">
        <BatchUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
        <BatchList basePath="/dashboard" refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
