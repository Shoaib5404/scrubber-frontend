'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { AppSelect, AsyncCombobox } from '@/components/forms';
import { listTenants } from '@/modules/tenants-admin/api';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SmartTime } from '@/components/ui/smart-time';

type BatchListProps = {
  basePath: '/portal' | '/dashboard';
  refreshKey?: number;
  showTenantFilter?: boolean;
  onStats?: (stats: {
    total: number;
    inFlight: number;
    complete: number;
    error: number;
  }) => void;
};

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function BatchList({
  basePath,
  refreshKey = 0,
  showTenantFilter = false,
  onStats,
}: BatchListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status') || 'all';
  const initialTenant = parsePositiveInt(searchParams.get('tenant_id'));
  const initialPage = parsePositiveInt(searchParams.get('page')) ?? 1;

  const [page, setPage] = useState(initialPage);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [tenantFilter, setTenantFilter] = useState<number | null>(initialTenant);
  const [tenantLabel, setTenantLabel] = useState('');
  const [data, setData] = useState<LengthAwarePaginator<BatchSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenantOptions = useCallback(
    async (query: string, signal: AbortSignal) => {
      const result = await listTenants(1, query);
      if (signal.aborted) return [];
      return result.data.map((t) => ({
        value: String(t.id),
        label: t.name,
      }));
    },
    [],
  );

  const syncUrl = useCallback(
    (next: { page: number; status: string; tenantId: number | null }) => {
      const params = new URLSearchParams();
      if (next.page > 1) params.set('page', String(next.page));
      if (next.status && next.status !== 'all') params.set('status', next.status);
      if (showTenantFilter && next.tenantId != null) {
        params.set('tenant_id', String(next.tenantId));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, showTenantFilter],
  );

  useEffect(() => {
    if (!showTenantFilter || tenantFilter == null) return;
    let cancelled = false;
    void listTenants(1, '')
      .then((result) => {
        if (cancelled) return;
        const match = result.data.find((t) => t.id === tenantFilter);
        if (match) setTenantLabel(match.name);
      })
      .catch(() => {
        /* keep prior label */
      });
    return () => {
      cancelled = true;
    };
  }, [showTenantFilter, tenantFilter]);

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
          tenant_id: showTenantFilter && tenantFilter != null ? tenantFilter : undefined,
        });
        setData(result);
        if (onStats && page === 1 && statusFilter === 'all' && tenantFilter == null) {
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
    [page, statusFilter, tenantFilter, showTenantFilter, onStats],
  );

  useEffect(() => {
    // Data fetch on filter/page/refresh — established batch list pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote fetch
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

  const columns = useMemo<LegacyColumnDef<BatchSummary>[]>(() => {
    const cols: LegacyColumnDef<BatchSummary>[] = [
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
            <div className="text-xs text-muted-foreground tabular-nums">
              #{row.original.id}
            </div>
          </div>
        ),
      },
    ];

    if (showTenantFilter) {
      cols.push({
        id: 'tenant',
        header: 'Tenant',
        cell: ({ row }) => (
          <span className="text-muted-foreground" data-testid={`batch-tenant-${row.original.id}`}>
            {row.original.tenant_name ?? '—'}
          </span>
        ),
      });
    }

    cols.push(
      {
        accessorKey: 'status',
        header: 'Stage',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'total_claims',
        header: 'Claims',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.total_claims}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <SmartTime
            value={row.original.created_at}
            className="text-muted-foreground"
          />
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
    );

    return cols;
  }, [basePath, showTenantFilter]);

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
        <div className="ml-auto flex flex-wrap items-end justify-end gap-3">
          {showTenantFilter ? (
            <AsyncCombobox
              id="batch-tenant-filter"
              label="Tenant"
              value={tenantFilter != null ? String(tenantFilter) : 'all'}
              displayLabel={
                tenantFilter != null ? tenantLabel || `Tenant #${tenantFilter}` : 'All tenants'
              }
              loadOptions={loadTenantOptions}
              leadingOptions={[{ value: 'all', label: 'All tenants' }]}
              placeholder="All tenants"
              searchPlaceholder="Search tenants…"
              triggerClassName="w-[220px]"
              data-testid="batch-tenant-filter"
              onValueChange={(value, option) => {
                const next =
                  value && value !== 'all' ? parsePositiveInt(value) : null;
                setPage(1);
                setTenantFilter(next);
                setTenantLabel(
                  next == null ? '' : option?.label ?? tenantLabel,
                );
                syncUrl({ page: 1, status: statusFilter, tenantId: next });
              }}
            />
          ) : null}
          <AppSelect
            id="batch-status-filter"
            label="Status"
            value={statusFilter}
            triggerClassName="w-[180px]"
            data-testid="batch-status-filter"
            options={BATCH_STATUS_FILTERS.map((opt) => ({
              value: opt.value || 'all',
              label: opt.label,
            }))}
            onValueChange={(value) => {
              const next = value || 'all';
              setPage(1);
              setStatusFilter(next);
              syncUrl({ page: 1, status: next, tenantId: tenantFilter });
            }}
          />
        </div>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={!loading && !!data && data.data.length === 0}
        emptyTitle="No batches yet"
        emptyMessage="Upload an EDI file to get started."
        onRetry={() => void load()}
        skeleton={
          <TableSkeleton rows={8} columns={showTenantFilter ? 6 : 5} />
        }
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
              onPageChange={(nextPage) => {
                setPage(nextPage);
                syncUrl({
                  page: nextPage,
                  status: statusFilter,
                  tenantId: tenantFilter,
                });
              }}
              className="px-3"
              data-testid="batch-pagination"
            />
          ) : null}
        </div>
      </AsyncState>
    </section>
  );
}
