'use client';

import { useEffect, useState } from 'react';
import { AppSelect } from '@/components/forms';
import { PaginationControls } from '@/components/layout/pagination-controls';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppShell } from '@/modules/batches/components/app-shell';
import {
  Permission,
  RequireAuth,
  hasPermission,
  useAuthStore,
} from '@/modules/auth';
import {
  INQUIRY_STATUSES,
  listAdminInquiries,
  type InquiryTicket,
} from '@/modules/support/api';
import { InquiriesTable } from '@/modules/support/components/inquiries-table';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  ...INQUIRY_STATUSES.map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

export default function StaffInquiriesPage() {
  const user = useAuthStore((s) => s.user);
  const canView = hasPermission(user, Permission.InquiriesView);
  const [rows, setRows] = useState<InquiryTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listAdminInquiries({
      page,
      status: status === 'all' ? undefined : status,
      q: q.trim() || undefined,
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
          setError(e instanceof Error ? e.message : 'Failed to load inquiries');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canView, page, status, q]);

  return (
    <RequireAuth staffOnly>
      <AppShell title="Inquiries" basePath="/dashboard">
        {!canView ? (
          <p className="text-sm text-destructive">
            You do not have permission to view inquiries.
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <AppSelect
                id="inquiries-status-filter"
                label="Status"
                value={status}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All"
                className="min-w-[12rem]"
                data-testid="inquiries-status-filter"
              />
              <div className="flex min-w-[16rem] flex-col gap-1.5">
                <Label htmlFor="inquiries-search">Search</Label>
                <Input
                  id="inquiries-search"
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Reference, email, subject…"
                  data-testid="inquiries-search"
                />
              </div>
            </div>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <InquiriesTable rows={rows} />
                <PaginationControls
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  onPageChange={setPage}
                  data-testid="inquiries-pagination"
                />
              </>
            )}
          </>
        )}
      </AppShell>
    </RequireAuth>
  );
}
