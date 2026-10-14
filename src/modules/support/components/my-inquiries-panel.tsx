'use client';

import { useEffect, useState } from 'react';
import { PaginationControls } from '@/components/layout/pagination-controls';
import { listMyInquiries, type InquiryTicket } from '../api';
import { MyInquiriesTable } from './my-inquiries-table';

type Props = {
  refreshKey?: number;
};

export function MyInquiriesPanel({ refreshKey = 0 }: Props) {
  const [rows, setRows] = useState<InquiryTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listMyInquiries({ page })
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
  }, [page, refreshKey]);

  return (
    <section className="space-y-3" data-testid="my-inquiries-panel">
      <div>
        <h2 className="text-base font-semibold">My inquiries</h2>
        <p className="text-sm text-muted-foreground">
          Expand a reference for a quick preview, or choose View for the full
          conversation.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <MyInquiriesTable rows={rows} />
          {total > 0 ? (
            <PaginationControls
              page={page}
              lastPage={lastPage}
              total={total}
              onPageChange={setPage}
              data-testid="my-inquiries-pagination"
            />
          ) : null}
        </>
      )}
    </section>
  );
}
