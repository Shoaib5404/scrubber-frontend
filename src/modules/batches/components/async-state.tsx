'use client';

import { ApiClientError } from '@/lib/api/errors';

type AsyncStateProps = {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
};

export function friendlyError(err: unknown): string {
  if (err instanceof ApiClientError) {
    return err.title ?? err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyMessage = 'Nothing to show yet.',
  onRetry,
  children,
}: AsyncStateProps) {
  if (loading) {
    return (
      <p className="text-sm text-slate-600" role="status">
        Loading…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        <p>{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-red-300 bg-white px-2.5 py-1 text-red-900 hover:bg-red-50"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return <p className="text-sm text-slate-600">{emptyMessage}</p>;
  }

  return <>{children}</>;
}
