'use client';

import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { TableSkeleton } from '@/components/layout/table-skeleton';

type AsyncStateProps = {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
};

export function friendlyError(err: unknown): string {
  return getUserFacingErrorMessage(err);
}

function DefaultSkeleton() {
  return <TableSkeleton rows={5} columns={4} />;
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyMessage = 'Nothing to show yet.',
  emptyTitle = 'No results',
  onRetry,
  children,
  skeleton,
}: AsyncStateProps) {
  if (loading) {
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (empty) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return <>{children}</>;
}
