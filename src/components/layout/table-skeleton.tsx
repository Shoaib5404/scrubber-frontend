import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      role="status"
      aria-label="Loading table"
    >
      <div className="flex gap-3 border-b border-border bg-muted/60 px-3 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border/80">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={`r-${row}`} className="flex gap-3 px-3 py-3">
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton
                key={`c-${row}-${col}`}
                className={cn("h-3.5 flex-1", col === 0 && "max-w-[28%]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
