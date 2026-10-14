'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import {
  listPortalAuditEvents,
  type AuditEventRow,
} from '@/modules/audit/api';
import { AuditEventsTable } from '@/modules/audit/components/audit-events-table';
import { PaginationControls } from '@/components/layout/pagination-controls';

export default function PortalAuditLogsPage() {
  const [rows, setRows] = useState<AuditEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listPortalAuditEvents({ page })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setTotal(result.total);
        setLastPage(result.last_page);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load audit logs');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <RequireAuth customerOnly>
      <AppShell title="Audit logs" basePath="/portal">
        <p className="mt-1 text-sm text-muted-foreground">
          Events for your organization only.
        </p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <AuditEventsTable rows={rows} />
            <PaginationControls
              page={page}
              lastPage={lastPage}
              total={total}
              onPageChange={setPage}
              data-testid="audit-pagination"
            />
          </>
        )}
      </AppShell>
    </RequireAuth>
  );
}
