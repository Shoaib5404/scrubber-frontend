'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/brand';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { fetchApiHealth } from '@/lib/api';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string }
  | { kind: 'unavailable'; message: string };

export default function Home() {
  useDocumentTitle('Home');
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetchApiHealth()
      .then((result) => {
        if (!cancelled) {
          setHealth({ kind: 'ok', status: result.status });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'API unavailable';
          setHealth({ kind: 'unavailable', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <BrandLogo variant="logo" priority className="h-14 w-auto" />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Neo Scrubber
      </h1>
      <p className="text-muted-foreground">
        Next.js frontend scaffold. API base URL comes from{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_API_URL
        </code>
        .
      </p>
      <p
        aria-live="polite"
        className={
          health.kind === 'ok'
            ? 'text-success'
            : health.kind === 'unavailable'
              ? 'text-warning'
              : 'text-muted-foreground'
        }
      >
        {health.kind === 'loading' && 'Checking API…'}
        {health.kind === 'ok' && `API ok (${health.status})`}
        {health.kind === 'unavailable' && `API unavailable`}
      </p>
      <ul className="flex list-none flex-col gap-2 pl-0 text-foreground/90">
        <li>
          <Link className="font-medium text-primary underline-offset-2 hover:underline" href="/login">
            Sign in
          </Link>
        </li>
        <li>
          <Link className="text-muted-foreground underline-offset-2 hover:underline" href="/dashboard">
            Staff dashboard
          </Link>
        </li>
        <li>
          <Link className="text-muted-foreground underline-offset-2 hover:underline" href="/portal">
            Customer portal
          </Link>
        </li>
      </ul>
    </main>
  );
}
