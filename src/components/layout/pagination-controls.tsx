"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  lastPage: number;
  total?: number;
  onPageChange: (page: number) => void;
  className?: string;
  "data-testid"?: string;
};

export function PaginationControls({
  page,
  lastPage,
  total,
  onPageChange,
  className,
  "data-testid": dataTestId,
}: PaginationControlsProps) {
  if (lastPage < 1) return null;

  const canPrev = page > 1;
  const canNext = page < lastPage;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-card/40 px-1 py-3",
        className,
      )}
      data-testid={dataTestId}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        Page {page} of {lastPage}
        {typeof total === "number" ? ` · ${total.toLocaleString()} total` : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}
          aria-label="Next page"
        >
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
