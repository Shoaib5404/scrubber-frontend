'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { listReferenceDomains } from '../api';
import { domainHasOp, type DomainSummary } from '../types';

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
    <section aria-labelledby="reference-domains-heading" className="space-y-5">
      <div className="space-y-1.5">
        <h2 id="reference-domains-heading" className="text-base font-semibold text-foreground">
          Reference domains
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          One shared admin for all Nest reference tables — not a separate page per domain route.
          Use Import/Export where shown; other bulk loads stay on Nest CLI (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            npm run cli -- …:import
          </code>
          ).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative w-full max-w-md space-y-1.5">
            <Label htmlFor="reference-domain-filter" className="text-muted-foreground">
              Filter domains
            </Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reference-domain-filter"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, slug, or op…"
                className="pl-9"
                data-testid="reference-domain-filter"
              />
            </div>
          </div>
          {!loading && domains ? (
            <p
              className="text-xs text-muted-foreground tabular-nums sm:pb-2"
              data-testid="reference-domain-count"
            >
              Showing {filtered.length} of {domains.length} domains
            </p>
          ) : null}
        </div>
      </div>

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
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((domain) => (
            <li key={domain.slug}>
              <Link
                href={`/dashboard/references/${domain.slug}`}
                data-testid={`reference-domain-link-${domain.slug}`}
                className="group block h-full rounded-xl border border-border bg-card p-4 shadow-xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/40 hover:shadow-sm"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary">
                  {domain.title}
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{domain.slug}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {domainHasOp(domain.ops, 'import') ? (
                    <Badge variant="secondary" className="rounded-md uppercase tracking-wide">
                      Import
                    </Badge>
                  ) : null}
                  {domainHasOp(domain.ops, 'export') ? (
                    <Badge variant="secondary" className="rounded-md uppercase tracking-wide">
                      Export
                    </Badge>
                  ) : null}
                  {!domainHasOp(domain.ops, 'create') && !domainHasOp(domain.ops, 'update') ? (
                    <Badge variant="outline" className="rounded-md uppercase tracking-wide">
                      Read-only
                    </Badge>
                  ) : null}
                  {domainHasOp(domain.ops, 'toggle_active') ? (
                    <Badge variant="outline" className="rounded-md uppercase tracking-wide">
                      Toggle
                    </Badge>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </AsyncState>
    </section>
  );
}
