'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
import { listReferenceDomains } from '../api';
import type { DomainSummary } from '../types';

export function DomainList() {
  const [domains, setDomains] = useState<DomainSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section aria-labelledby="reference-domains-heading">
      <h2 id="reference-domains-heading" className="sr-only">
        Reference domains
      </h2>
      <AsyncState
        loading={loading}
        error={error}
        empty={!loading && !!domains && domains.length === 0}
        emptyMessage="No reference domains are registered."
        onRetry={() => void load()}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains?.map((domain) => (
            <li key={domain.slug}>
              <Link
                href={`/dashboard/references/${domain.slug}`}
                data-testid={`reference-domain-link-${domain.slug}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <h3 className="font-semibold text-slate-900">{domain.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{domain.slug}</p>
                <p className="mt-2 text-xs text-slate-600">
                  {domain.ops.length} operation{domain.ops.length === 1 ? '' : 's'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </AsyncState>
    </section>
  );
}
