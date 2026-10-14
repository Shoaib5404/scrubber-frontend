'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { listBatches } from '../api';
import {
  BATCH_STATUS_FILTERS,
  isBatchStatusPollable,
  type BatchSummary,
  type LengthAwarePaginator,
} from '../types';
import { AsyncState, friendlyError } from './async-state';
import { StatusBadge } from './status-badge';
import { PaginationControls } from '@/components/layout/pagination-controls';
import { TableSkeleton } from '@/components/layout/table-skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type BatchListProps = {
  basePath: '/portal' | '/dashboard';
  refreshKey?: number;
  onStats?: (stats: {
    total: number;
    inFlight: number;
    complete: number;
    error: number;
  }) => void;
};

export function BatchList({ basePath, refreshKey = 0, onStats }: BatchListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [data, setData] = useState<LengthAwarePaginator<BatchSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!opts?.quiet) {
        setLoading(true);
      }
      setError(null);
      try {
        const result = await listBatches({
          page,
          per_page: 15,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        setData(result);
        if (onStats && page === 1 && statusFilter === 'all') {
          const rows = result.data;
          onStats({
            total: result.total,
            inFlight: rows.filter((b) => isBatchStatusPollable(b.status)).length,
            complete: rows.filter((b) =>
              ['validation_complete', 'validated', 'exported', 'completed'].includes(
                b.status.toLowerCase(),
              ),
            ).length,
            error: rows.filter((b) => b.status.toLowerCase().includes('error')).length,
          });
        }
      } catch (err) {
        setError(friendlyError(err));
        setData(null);
      } finally {
        if (!opts?.quiet) {
          setLoading(false);
        }
      }
    },
    [page, statusFilter, onStats],
  );

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    const hasInFlight = data?.data.some((b) => isBatchStatusPollable(b.status));
    if (!hasInFlight) return;
    const timer = window.setInterval(() => {
      void load({ quiet: true });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [data, load]);

  const columns = useMemo<LegacyColumnDef<BatchSummary>[]>(
    () => [
      {
        accessorKey: 'original_filename',
        header: 'File',
        cell: ({ row }) => (
          <div>
            <Link
              href={`${basePath}/batches/${row.original.id}`}
              className="font-medium text-foreground underline-offset-2 hover:underline"
              data-testid={`batch-link-${row.original.id}`}
            >
              {row.original.original_filename}
            </Link>
            <div className="text-xs text-muted-foreground tabular-nums">#{row.original.id}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Stage',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'total_claims',
        header: 'Claims',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.original.total_claims}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'edi',
        header: 'EDI',
        cell: ({ row }) => (
          <Link
            href={`${basePath}/batches/${row.original.id}/edi`}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            title="Open EDI file"
            data-testid={`batch-edi-${row.original.id}`}
          >
            View
          </Link>
        ),
      },
    ],
    [basePath],
  );

  const table = useLegacyTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section aria-labelledby="batch-list-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 id="batch-list-heading" className="text-base font-semibold text-foreground">
          Batches
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="batch-status-filter" className="text-muted-foreground">
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(value ?? 'all');
              }}
            >
              <SelectTrigger
                id="batch-status-filter"
                className="w-[180px]"
                data-testid="batch-status-filter"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATCH_STATUS_FILTERS.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={!loading && !!data && data.data.length === 0}
        emptyTitle="No batches yet"
        emptyMessage="Upload an EDI file to get started."
        onRetry={() => void load()}
        skeleton={<TableSkeleton rows={8} columns={5} />}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data ? (
            <PaginationControls
              page={data.current_page}
              lastPage={data.last_page}
              total={data.total}
              onPageChange={setPage}
              className="px-3"
              data-testid="batch-pagination"
            />
          ) : null}
        </div>
      </AsyncState>
    </section>
  );
}
