'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Route-level error UI. Never render exception messages or digests that may
 * contain internal diagnostics — keep recovery actions only.
 */
export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    // Keep diagnostics in the browser console for developers; do not surface them.
    console.error('Application error boundary:', error.digest ?? error.name);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load this page. Please try again. If the issue continues,
        contact support.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
