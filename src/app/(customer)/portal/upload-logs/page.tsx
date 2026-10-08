'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <table className="mt-4 w-full text-left text-sm" data-testid="upload-logs-table">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2 pr-3">File</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-2 pr-3">{r.original_filename ?? '—'}</td>
                <td className="py-2 pr-3">{r.status}</td>
                <td className="py-2">{r.error_message ?? r.error_type ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppShell>
    </RequireAuth>
  );
}
