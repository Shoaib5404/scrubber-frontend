'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import {
  Permission,
  RequireAuth,
  hasPermission,
  useAuthStore,
} from '@/modules/auth';
import {
  listAdminAuditEvents,
  type AuditEventRow,
} from '@/modules/audit/api';
import { AuditEventsTable } from '@/modules/audit/components/audit-events-table';
import { PaginationControls } from '@/components/layout/pagination-controls';

export default function StaffAuditLogsPage() {
  const user = useAuthStore((s) => s.user);
  const canView = hasPermission(user, Permission.AuditView);
  const [rows, setRows] = useState<AuditEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listAdminAuditEvents({
      page,
      category: category.trim() || undefined,
    })
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
  }, [canView, page, category]);

  return (
    <RequireAuth staffOnly>
      <AppShell title="Audit logs" basePath="/dashboard">
        {!canView ? (
          <p className="text-sm text-destructive">
            You do not have permission to view audit logs.
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Category code</span>
                <input
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  value={category}
                  onChange={(e) => {
                    setPage(1);
                    setCategory(e.target.value);
                  }}
                  placeholder="e.g. auth.login"
                  data-testid="audit-category-filter"
                />
              </label>
            </div>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <AuditEventsTable rows={rows} showTenant />
                <PaginationControls
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  onPageChange={setPage}
                  data-testid="audit-pagination"
                />
              </>
            )}
          </>
        )}
      </AppShell>
    </RequireAuth>
  );
}
