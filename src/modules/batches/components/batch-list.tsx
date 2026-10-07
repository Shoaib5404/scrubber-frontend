'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { listBatches } from '../api';
import type { BatchSummary, LaravelPaginator } from '../types';
import { AsyncState, friendlyError } from './async-state';
import { StatusBadge } from './status-badge';

type BatchListProps = {
  basePath: '/portal' | '/dashboard';
  refreshKey?: number;
};

export function BatchList({ basePath, refreshKey = 0 }: BatchListProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LaravelPaginator<BatchSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listBatches({ page, per_page: 15 });
      setData(result);
    } catch (err) {
      setError(friendlyError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section aria-labelledby="batch-list-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="batch-list-heading" className="text-base font-semibold text-slate-900">
          Batches
        </h2>
        {data ? (
          <p className="text-xs text-slate-500" data-testid="batch-pagination">
            Page {data.current_page} of {data.last_page} · {data.total} total
          </p>
        ) : null}
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
