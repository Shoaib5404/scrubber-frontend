'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { listBatches } from '../api';
import {
  BATCH_STATUS_FILTERS,
  isBatchStatusPollable,
  type BatchSummary,
  type LengthAwarePaginator,
} from '../types';
import { AsyncState, friendlyError } from './async-state';
import { StatusBadge } from './status-badge';

type BatchListProps = {
  basePath: '/portal' | '/dashboard';
  refreshKey?: number;
};

export function BatchList({ basePath, refreshKey = 0 }: BatchListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [data, setData] = useState<LengthAwarePaginator<BatchSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await listBatches({
        page,
        per_page: 15,
        status: statusFilter || undefined,
      });
      setData(result);
    } catch (err) {
      setError(friendlyError(err));
      setData(null);
    } finally {
      if (!opts?.quiet) {
        setLoading(false);
      }
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    const hasInFlight = data?.data.some((b) => isBatchStatusPollable(b.status));
    if (!hasInFlight) return;
    const timer = window.setInterval(() => {
      void load({ quiet: true });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [data, load]);

  return (
    <section aria-labelledby="batch-list-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="batch-list-heading" className="text-base font-semibold text-slate-900">
          Batches
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              data-testid="batch-status-filter"
            >
              {BATCH_STATUS_FILTERS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {data ? (
            <p className="text-xs text-slate-500" data-testid="batch-pagination">
              Page {data.current_page} of {data.last_page} · {data.total} total
            </p>
          ) : null}
        </div>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={!loading && !!data && data.data.length === 0}
        emptyMessage="No batches yet. Upload an EDI file to get started."
        onRetry={() => void load()}
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Claims</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">EDI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`${basePath}/batches/${batch.id}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                      data-testid={`batch-link-${batch.id}`}
                    >
                      {batch.original_filename}
                    </Link>
                    <div className="text-xs text-slate-500">#{batch.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{batch.total_claims}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(batch.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`${basePath}/batches/${batch.id}/edi`}
                      className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
                      title="Open EDI file"
                      data-testid={`batch-edi-${batch.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.last_page > 1 ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= data.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </AsyncState>
    </section>
  );
}
