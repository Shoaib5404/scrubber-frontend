'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import { cptExactSearch, searchReference, type CodingRefItem } from '../api';

type Kind = 'cpt' | 'icd10' | 'modifiers';

/**
 * Debounced coding reference search (CPT / ICD-10 / modifiers).
 * CPT exact-match also supports jump to /cpt/[code] explorer.
 */
export function CodingSearchPanel() {
  const router = useRouter();
  const qId = useId();
  const [kind, setKind] = useState<Kind>('cpt');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<CodingRefItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setItems([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void searchReference(kind, debounced)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof ApiClientError ? err.title ?? err.message : 'Search failed.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, kind]);

  function openCptExplorer() {
    const code = query.trim();
    if (!code) return;
    startTransition(async () => {
      setError(null);
      try {
        const hit = await cptExactSearch(code);
        router.push(`/cpt/${encodeURIComponent(hit.code)}`);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.title ?? err.message : 'CPT lookup failed.');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['cpt', 'CPT / HCPCS'],
            ['icd10', 'ICD-10'],
            ['modifiers', 'Modifiers'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              kind === value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={qId} className="block text-sm font-medium text-slate-800">
            Search
          </label>
          <input
            id={qId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === 'cpt' ? 'e.g. 97597 or 9921' : 'Type a code prefix…'}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        {kind === 'cpt' ? (
          <button
            type="button"
            disabled={pending || !query.trim()}
            onClick={openCptExplorer}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? 'Opening…' : 'Open CPT explorer'}
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-600" role="status">
          Searching…
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && debounced && items.length === 0 && !error ? (
        <p className="text-sm text-slate-600">No matches.</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {items.map((item) => (
            <li key={`${kind}-${item.code}`} className="px-4 py-3 text-sm">
              {kind === 'cpt' ? (
                <Link
                  href={`/cpt/${encodeURIComponent(item.code)}`}
                  className="font-medium text-slate-900 underline-offset-2 hover:underline"
                >
                  {item.code}
                </Link>
              ) : (
                <span className="font-medium text-slate-900">{item.code}</span>
              )}
              <p className="mt-0.5 text-slate-600">{item.description ?? '—'}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
