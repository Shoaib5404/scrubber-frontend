'use client';

import Link from 'next/link';
import { StatusBadge } from '@/modules/batches';
import type { BatchSummary } from '@/modules/batches';
import { EmptyState } from '@/components/layout/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SmartTime } from '@/components/ui/smart-time';

type RecentBatchesPanelProps = {
  batches: BatchSummary[];
  basePath: '/dashboard' | '/portal';
  showTenant?: boolean;
  viewAllHref: string;
};

export function RecentBatchesPanel({
  batches,
  basePath,
  showTenant = false,
  viewAllHref,
}: RecentBatchesPanelProps) {
  return (
    <section
      aria-labelledby="recent-batches-heading"
      className="flex flex-col gap-3"
      data-testid="dashboard-recent-batches"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="recent-batches-heading" className="text-base font-semibold text-foreground">
          Recent batches
        </h2>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          View all batches
        </Link>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title="No recent batches"
          description="Uploaded EDI files will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                {showTenant ? <TableHead>Tenant</TableHead> : null}
                <TableHead>Status</TableHead>
                <TableHead>Claims</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    <Link
                      href={`${basePath}/batches/${batch.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {batch.original_filename}
                    </Link>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      #{batch.id}
                    </div>
                  </TableCell>
                  {showTenant ? (
                    <TableCell className="text-muted-foreground">
                      {batch.tenant_name ?? '—'}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <StatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {batch.total_claims}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <SmartTime value={batch.created_at} display="absolute" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
