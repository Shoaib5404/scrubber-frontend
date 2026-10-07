'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import { CPT_TABS, getCptSummary, getCptTab, type CptSummary, type CptTabPayload } from '../api';

export function CptDetailView({ code }: { code: string }) {
  const [summary, setSummary] = useState<CptSummary | null>(null);
  const [tab, setTab] = useState(CPT_TABS[0].key);
  const [payload, setPayload] = useState<CptTabPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getCptSummary(code)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((err) => {
        if (!cancelled) {
          setSummary(null);
          setError(err instanceof ApiClientError ? err.title ?? err.message : 'Failed to load CPT.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!summary) return;
    let cancelled = false;
    void getCptTab(summary.code, tab)
      .then((p) => {
        if (!cancelled) setPayload(p);
      })
      .catch((err) => {
        if (!cancelled) {
          setPayload(null);
          setError(err instanceof ApiClientError ? err.title ?? err.message : 'Failed to load tab.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [summary, tab]);

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href="/search" className="text-slate-600 underline-offset-2 hover:underline">
          ← Back to search
        </Link>
      </p>

      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {summary ? (
        <>
          <h2 className="text-xl font-semibold text-slate-900">{summary.code}</h2>
          <p className="mt-1 text-sm text-slate-600">{summary.description ?? 'No description'}</p>
          <p className="mt-2 text-xs text-slate-500">
            {summary.status}
            {summary.effective_date ? ` · Effective ${summary.effective_date}` : ''}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {CPT_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  tab === t.key
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {payload ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              {payload.message ? (
                <p className="px-4 py-3 text-sm text-slate-600">{payload.message}</p>
              ) : null}
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {payload.columns.map((c) => (
                      <th key={c.key} className="px-3 py-2 font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payload.rows.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-3 text-slate-500"
                        colSpan={Math.max(1, payload.columns.length)}
                      >
                        No rows for this tab.
                      </td>
                    </tr>
                  ) : (
                    payload.rows.map((row, idx) => (
                      <tr key={idx}>
                        {payload.columns.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-slate-800">
                            {String(row[c.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                Page {payload.pagination.current_page} of {payload.pagination.last_page} ·{' '}
                {payload.pagination.total} total
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
