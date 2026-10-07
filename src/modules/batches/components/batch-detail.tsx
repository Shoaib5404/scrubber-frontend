'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getBatch, listBatchClaims, validateBatch } from '../api';
import type { BatchStatistics, BatchSummary, ClaimSummary, LaravelPaginator } from '../types';
import { AsyncState, friendlyError } from './async-state';
import { ClaimStatusBadge, StatusBadge } from './status-badge';

type BatchDetailProps = {
  batchId: number;
  basePath: '/portal' | '/dashboard';
};

export function BatchDetail({ batchId, basePath }: BatchDetailProps) {
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [stats, setStats] = useState<BatchStatistics | null>(null);
  const [claims, setClaims] = useState<LaravelPaginator<ClaimSummary> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, claimPage] = await Promise.all([
        getBatch(batchId),
        listBatchClaims(batchId, { page, per_page: 20 }),
      ]);
      setBatch(detail.batch);
      setStats(detail.statistics);
      setClaims(claimPage);
    } catch (err) {
      setError(friendlyError(err));
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [batchId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onValidate(force = false) {
    setActionBusy(true);
    setActionMsg(null);
    try {
      const { body } = await validateBatch(batchId, force);
      setActionMsg(body.message ?? `Validation status: ${body.data.status}`);
      await load();
    } catch (err) {
      setActionMsg(friendlyError(err));
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href={basePath} className="text-slate-600 underline-offset-2 hover:underline">
          ← Back to batches
        </Link>
      </p>

      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {batch ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{batch.original_filename}</h2>
                <p className="mt-1 text-sm text-slate-600">Batch #{batch.id}</p>
                <div className="mt-2">
                  <StatusBadge status={batch.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void onValidate(false)}
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {actionBusy ? 'Working…' : 'Run / check validation'}
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void onValidate(true)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Force re-validate
                </button>
              </div>
            </div>

            {actionMsg ? (
              <p className="mt-3 text-sm text-slate-700" role="status" data-testid="validate-message">
                {actionMsg}
              </p>
            ) : null}

            {stats ? (
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Total claims', stats.total_claims],
                  ['Valid', stats.valid_claims],
                  ['Warnings', stats.warning_claims],
                  ['Errors', stats.error_claims],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  >
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-lg font-semibold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <section className="mt-8" aria-labelledby="claims-heading">
              <div className="mb-3 flex items-center justify-between">
                <h3 id="claims-heading" className="text-base font-semibold">
                  Claims
                </h3>
                {claims ? (
                  <p className="text-xs text-slate-500" data-testid="claim-pagination">
                    Page {claims.current_page} of {claims.last_page} · {claims.total} total
                  </p>
                ) : null}
              </div>

              {claims && claims.data.length === 0 ? (
                <p className="text-sm text-slate-600">No claims in this batch.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Claim ID</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Charge</th>
                        <th className="px-4 py-3 font-medium">Payer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claims?.data.map((claim) => (
                        <tr key={claim.id}>
                          <td className="px-4 py-3">
                            <Link
                              href={`${basePath}/claims/${claim.id}`}
                              className="font-medium text-slate-900 underline-offset-2 hover:underline"
                              data-testid={`claim-link-${claim.id}`}
                            >
                              {claim.claim_id}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <ClaimStatusBadge status={claim.status} />
                          </td>
                          <td className="px-4 py-3">{claim.total_charge.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-600">{claim.payer_name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {claims && claims.last_page > 1 ? (
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
                    disabled={page >= claims.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}
