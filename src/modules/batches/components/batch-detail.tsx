'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { FileCode2Icon, Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { canUploadOrValidate, useAuthStore } from '@/modules/auth';
import { getBatch, getBatchStatus, listBatchClaims, validateBatch } from '../api';
import {
  isBatchStatusPollable,
  isBatchStatusTerminal,
  type BatchStatistics,
  type BatchSummary,
  type ClaimSummary,
  type LengthAwarePaginator,
} from '../types';
import { AsyncState, friendlyError } from './async-state';
import { ClaimStatusBadge, StatusBadge } from './status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/layout/empty-state';
import { PaginationControls } from '@/components/layout/pagination-controls';

type BatchDetailProps = {
  batchId: number;
  basePath: '/portal' | '/dashboard';
};

export function BatchDetail({ batchId, basePath }: BatchDetailProps) {
  const user = useAuthStore((s) => s.user);
  const canValidate = canUploadOrValidate(user);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [stats, setStats] = useState<BatchStatistics | null>(null);
  const [claims, setClaims] = useState<LengthAwarePaginator<ClaimSummary> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [pollLabel, setPollLabel] = useState<string | null>(null);
  const reloadClaimsAfterTerminal = useRef(false);

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!opts?.quiet) {
        setLoading(true);
      }
      setError(null);
      try {
        const [detail, claimPage] = await Promise.all([
          getBatch(batchId),
          listBatchClaims(batchId, { page, per_page: 20 }),
        ]);
        setBatch(detail.batch);
        setStats(detail.statistics);
        setClaims(claimPage);
      } catch (err) {
        setError(friendlyError(err));
        setBatch(null);
      } finally {
        if (!opts?.quiet) {
          setLoading(false);
        }
      }
    },
    [batchId, page],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!batch || !isBatchStatusPollable(batch.status)) {
      setPollLabel(null);
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const pollData = await getBatchStatus(batchId);
        if (cancelled) return;
        setPollLabel(pollData.label);
        setBatch((prev) =>
          prev
            ? {
                ...prev,
                status: pollData.status,
                total_claims: pollData.total_claims,
                valid_claims: pollData.valid_claims,
                error_claims: pollData.error_claims,
                warning_claims: pollData.warning_claims,
              }
            : prev,
        );
        setStats((prev) =>
          prev
            ? {
                ...prev,
                total_claims: pollData.total_claims,
                valid_claims: pollData.valid_claims,
                error_claims: pollData.error_claims,
                warning_claims: pollData.warning_claims,
                pending_claims: pollData.pending_claims,
              }
            : prev,
        );

        if (isBatchStatusTerminal(pollData.status) || pollData.status === 'parsed') {
          if (reloadClaimsAfterTerminal.current || isBatchStatusTerminal(pollData.status)) {
            reloadClaimsAfterTerminal.current = false;
            await load({ quiet: true });
          }
        }
      } catch {
        // Keep last known state; next tick retries.
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [batch?.status, batchId, load]);

  async function onValidate(force = false) {
    setActionBusy(true);
    setActionMsg(null);
    try {
      const { httpStatus, body } = await validateBatch(batchId, force);
      if (httpStatus === 202 || body.data.status === 'under_processing') {
        reloadClaimsAfterTerminal.current = true;
        setActionMsg(body.message ?? 'Validation queued. Status will update automatically.');
      } else {
        setActionMsg(body.message ?? `Validation status: ${body.data.status}`);
      }
      await load({ quiet: true });
    } catch (err) {
      setActionMsg(friendlyError(err));
    } finally {
      setActionBusy(false);
    }
  }

  const claimColumns = useMemo<LegacyColumnDef<ClaimSummary>[]>(
    () => [
      {
        accessorKey: 'claim_id',
        header: 'Claim ID',
        cell: ({ row }) => (
          <Link
            href={`${basePath}/claims/${row.original.id}`}
            className="font-medium text-foreground underline-offset-2 hover:underline"
            data-testid={`claim-link-${row.original.id}`}
          >
            {row.original.claim_id}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <ClaimStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'total_charge',
        header: 'Charge',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.total_charge.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'payer_name',
        header: 'Payer',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.payer_name ?? '—'}</span>
        ),
      },
    ],
    [basePath],
  );

  const claimTable = useLegacyTable({
    data: claims?.data ?? [],
    columns: claimColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <Link
          href={basePath}
          className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ← Back to batches
        </Link>
      </p>

      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {batch ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {batch.original_filename}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  Batch #{batch.id}
                </p>
                <div className="mt-2">
                  <StatusBadge status={batch.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={`${basePath}/batches/${batchId}/edi`}>
                    <FileCode2Icon data-icon="inline-start" />
                    View EDI
                  </Link>
                </Button>
                {canValidate ? (
                  <>
                    <Button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void onValidate(false)}
                    >
                      {actionBusy ? (
                        <Loader2Icon data-icon="inline-start" className="animate-spin" />
                      ) : (
                        <RefreshCwIcon data-icon="inline-start" />
                      )}
                      {actionBusy ? 'Working…' : 'Run / check validation'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionBusy}
                      onClick={() => void onValidate(true)}
                    >
                      Force re-validate
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            {isBatchStatusPollable(batch.status) ? (
              <Alert data-testid="batch-status-poll-banner">
                <AlertDescription>
                  {batch.status === 'validating' ? 'Validation in progress…' : 'Processing…'}{' '}
                  <span className="text-muted-foreground">
                    ({pollLabel ?? batch.status}) — refreshing every 3s
                  </span>
                </AlertDescription>
              </Alert>
            ) : null}

            {actionMsg ? (
              <Alert data-testid="validate-message">
                <AlertDescription>{actionMsg}</AlertDescription>
              </Alert>
            ) : null}

            {stats ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Total claims', stats.total_claims],
                  ['Valid', stats.valid_claims],
                  ['Warnings', stats.warning_claims],
                  ['Errors', stats.error_claims],
                ].map(([label, value]) => (
                  <Card key={String(label)} size="sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dd className="text-lg font-semibold tabular-nums text-foreground">
                        {value}
                      </dd>
                    </CardContent>
                  </Card>
                ))}
              </dl>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2" data-testid="isa-gs-envelope">
              <Card>
                <CardHeader>
                  <CardTitle id="isa-heading" className="text-base">
                    Interchange (ISA)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-2 text-sm">
                    {(
                      [
                        ['Sender ID', batch.isa_sender_id],
                        ['Receiver ID', batch.isa_receiver_id],
                        ['Control #', batch.isa_control_number],
                        ['ISA Date', batch.isa_date],
                        ['BHT Date', batch.bht_date],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium text-foreground tabular-nums">
                          {value ?? '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle id="gs-heading" className="text-base">
                    Functional Group (GS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-2 text-sm">
                    {(
                      [
                        ['Sender Code', batch.gs_sender_code],
                        ['Receiver Code', batch.gs_receiver_code],
                        ['Control #', batch.gs_control_number],
                        ['Version', batch.gs_version_code ?? batch.gs_version],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium text-foreground tabular-nums">
                          {value ?? '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </div>

            <section aria-labelledby="claims-heading" className="flex flex-col gap-3">
              <h3 id="claims-heading" className="text-base font-semibold">
                Claims
              </h3>

              {claims && claims.data.length === 0 ? (
                <EmptyState title="No claims" description="No claims in this batch." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <Table>
                    <TableHeader>
                      {claimTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {claimTable.getRowModel().rows.map((row) => (
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
                  {claims ? (
                    <PaginationControls
                      page={claims.current_page}
                      lastPage={claims.last_page}
                      total={claims.total}
                      onPageChange={setPage}
                      className="px-3"
                      data-testid="claim-pagination"
                    />
                  ) : null}
                </div>
              )}
            </section>
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}
