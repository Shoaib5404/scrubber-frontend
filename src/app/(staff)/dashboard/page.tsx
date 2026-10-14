'use client';

import { useCallback, useState } from 'react';
import { AppShell, BatchList, BatchUpload } from '@/modules/batches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PageStats = {
  total: number;
  inFlight: number;
  complete: number;
  error: number;
};

export default function StaffHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<PageStats | null>(null);

  const onStats = useCallback((next: PageStats) => {
    setStats(next);
  }, []);

  return (
    <AppShell
      title="Batches"
      description="Upload EDI files, monitor processing, and open claims for review."
      basePath="/dashboard"
    >
      <div className="flex flex-col gap-6">
        {stats ? (
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="batch-summary-stats">
            {[
              ['Total batches', stats.total],
              ['In progress (page)', stats.inFlight],
              ['Complete (page)', stats.complete],
              ['Errors (page)', stats.error],
            ].map(([label, value]) => (
              <Card key={String(label)} size="sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dd className="text-2xl font-semibold tabular-nums text-foreground">
                    {value}
                  </dd>
                </CardContent>
              </Card>
            ))}
          </dl>
        ) : null}

        <BatchUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
        <BatchList basePath="/dashboard" refreshKey={refreshKey} onStats={onStats} />
      </div>
    </AppShell>
  );
}
