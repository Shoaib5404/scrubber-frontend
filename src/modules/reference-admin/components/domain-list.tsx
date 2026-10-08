'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
import { listReferenceDomains } from '../api';
import { domainHasOp, type DomainSummary } from '../types';

function OpChip({ label }: { label: string }) {
  return (
    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
      {label}
    </span>
  );
}

export function DomainList() {
  const [domains, setDomains] = useState<DomainSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listReferenceDomains();
      setDomains(result);
    } catch (err) {
      setError(friendlyError(err));
      setDomains(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const filtered = useMemo(() => {
    if (!domains) return [];
    const q = query.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        d.ops.some((op) => op.includes(q)),
    );
  }, [domains, query]);

  return (
    <section aria-labelledby="reference-domains-heading" className="space-y-4">
      <div className="space-y-2">
        <h2 id="reference-domains-heading" className="text-base font-semibold text-slate-900">
          Reference domains
        </h2>
        <p className="max-w-3xl text-sm text-slate-600">
          One shared admin for all Nest reference tables — not a separate page per Laravel Blade
          route. Use Import/Export where shown; other bulk loads stay on Nest CLI (
          <code className="text-xs">npm run cli -- …:import</code>).
        </p>
      </div>

      <label className="block max-w-md text-sm">
        <span className="mb-1 block text-slate-600">Filter domains</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, slug, or op…"
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          data-testid="reference-domain-filter"
        />
      </label>

      <AsyncState
        loading={loading}
        error={error}
        empty={!loading && !!domains && filtered.length === 0}
        emptyMessage={
          domains && domains.length > 0
            ? 'No domains match your filter.'
            : 'No reference domains are registered.'
        }
        onRetry={() => void load()}
      >
        <p className="text-xs text-slate-500" data-testid="reference-domain-count">
          Showing {filtered.length}
          {domains ? ` of ${domains.length}` : ''} domains
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((domain) => (
            <li key={domain.slug}>
              <Link
                href={`/dashboard/references/${domain.slug}`}
                data-testid={`reference-domain-link-${domain.slug}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <h3 className="font-semibold text-slate-900">{domain.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{domain.slug}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {domainHasOp(domain.ops, 'import') ? <OpChip label="Import" /> : null}
                  {domainHasOp(domain.ops, 'export') ? <OpChip label="Export" /> : null}
                  {!domainHasOp(domain.ops, 'create') && !domainHasOp(domain.ops, 'update') ? (
                    <OpChip label="Read-only" />
                  ) : null}
                  {domainHasOp(domain.ops, 'toggle_active') ? <OpChip label="Toggle" /> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </AsyncState>
    </section>
  );
}
