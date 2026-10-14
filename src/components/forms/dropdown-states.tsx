'use client';

import { Button } from '@/components/ui/button';

export function DropdownLoadingState({
  message = 'Loading…',
}: {
  message?: string;
}) {
  return (
    <div
      className="px-2 py-6 text-center text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
      data-testid="dropdown-loading"
    >
      {message}
    </div>
  );
}

export function DropdownEmptyState({
  message = 'No options available.',
}: {
  message?: string;
}) {
  return (
    <div
      className="px-2 py-6 text-center text-sm text-muted-foreground"
      data-testid="dropdown-empty"
    >
      {message}
    </div>
  );
}

export function DropdownErrorState({
  message = 'Could not load options.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 px-2 py-6 text-center"
      data-testid="dropdown-error"
    >
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
