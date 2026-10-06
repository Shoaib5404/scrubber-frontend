'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchApiHealth } from '@/lib/api';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string }
  | { kind: 'unavailable'; message: string };

export default function Home() {
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
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Neo Scrubber
      </h1>
      <p className="text-slate-600">
        Next.js frontend scaffold. API base URL comes from{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_API_URL
        </code>
        .
      </p>
      <p
        aria-live="polite"
        className={
          health.kind === 'ok'
            ? 'text-emerald-700'
            : health.kind === 'unavailable'
              ? 'text-amber-700'
              : 'text-slate-500'
        }
      >
        {health.kind === 'loading' && 'Checking API…'}
        {health.kind === 'ok' && `API ok (${health.status})`}
        {health.kind === 'unavailable' && `API unavailable`}
      </p>
      <ul className="list-disc space-y-2 pl-5 text-slate-700">
        <li>
          <Link className="underline" href="/login">
            Sign in
          </Link>
        </li>
        <li>
          <Link className="underline" href="/dashboard">
            Staff dashboard placeholder
          </Link>
        </li>
        <li>
          <Link className="underline" href="/portal">
            Customer portal placeholder
          </Link>
        </li>
      </ul>
    </main>
  );
}
