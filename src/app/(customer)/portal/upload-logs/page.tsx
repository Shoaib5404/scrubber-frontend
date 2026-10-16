'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import { SmartTime } from '@/components/ui/smart-time';
import { sanitizeUploadLogError } from '@/lib/api/customer-facing-message';
import { listUploadLogs, type UploadLogRow } from '@/modules/upload-logs/api';

export default function PortalUploadLogsPage() {
  const [rows, setRows] = useState<UploadLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listUploadLogs()
      .then((page) => {
        if (!cancelled) setRows(page.data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load upload logs');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RequireAuth customerOnly>
      <AppShell title="Upload logs" basePath="/portal">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <table className="mt-4 w-full text-left text-sm" data-testid="upload-logs-table">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-3">File</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Error</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="py-2 pr-3">{r.original_filename ?? '—'}</td>
                <td className="py-2 pr-3">{r.status}</td>
                <td className="py-2 pr-3">{sanitizeUploadLogError(r)}</td>
                <td className="py-2">
                  <SmartTime value={r.created_at} display="absolute" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppShell>
    </RequireAuth>
  );
}
