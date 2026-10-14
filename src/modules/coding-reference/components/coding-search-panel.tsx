'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { SearchIcon } from 'lucide-react';
import { ApiClientError } from '@/lib/api/errors';
import { cptExactSearch, searchReference, type CodingRefItem } from '../api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Code type">
        {(
          [
            ['cpt', 'CPT / HCPCS'],
            ['icd10', 'ICD-10'],
            ['modifiers', 'Modifiers'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            variant={kind === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setKind(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={qId}>Search</Label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={qId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={kind === 'cpt' ? 'e.g. 97597 or 9921' : 'Type a code prefix…'}
              className="pl-8"
            />
          </div>
        </div>
        {kind === 'cpt' ? (
          <Button
            type="button"
            disabled={pending || !query.trim()}
            onClick={openCptExplorer}
          >
            {pending ? 'Opening…' : 'Open CPT explorer'}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Searching">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && debounced && items.length === 0 && !error ? (
        <EmptyState title="No matches" description="Try a different code or description." />
      ) : null}

      {items.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li
              key={`${kind}-${item.code}`}
              className={cn('px-4 py-3 text-sm transition-colors hover:bg-muted/40')}
            >
              {kind === 'cpt' ? (
                <Link
                  href={`/cpt/${encodeURIComponent(item.code)}`}
                  className="font-medium font-mono text-foreground underline-offset-2 hover:underline"
                >
                  {item.code}
                </Link>
              ) : (
                <span className="font-medium font-mono text-foreground">{item.code}</span>
              )}
              <p className="mt-0.5 text-muted-foreground">{item.description ?? '—'}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
