'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
import { PaginationControls } from '@/components/layout/pagination-controls';
import { TableSkeleton } from '@/components/layout/table-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/components/forms';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createDomainReference,
  deleteDomainReference,
  exportDomainReference,
  getDomainReference,
  importDomainReference,
  listDomainReferences,
  listReferenceDomains,
  toggleDomainReferenceActive,
  updateDomainReference,
} from '../api';
import { columnKeysFromItems, formatCellValue } from '../field-hints';
import type { DomainSummary, PaginatedRefs, ReferenceRow } from '../types';
import { domainHasOp } from '../types';
import { RecordFormModal } from './record-form-modal';

type DomainRecordsProps = {
  domainSlug: string;
};

/** Initial search from claim-issue deep links (`?search=` / `cpt` / `cpt_code`). */
function searchFromParams(params: URLSearchParams): string {
  return (
    params.get('search')?.trim() ||
    params.get('cpt')?.trim() ||
    params.get('cpt_code')?.trim() ||
    ''
  );
}

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit' | 'view'; row: ReferenceRow }
  | null;

function formatColumnLabel(col: string): string {
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DomainRecords({ domainSlug }: DomainRecordsProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchFromParams(searchParams);

  const [domainMeta, setDomainMeta] = useState<DomainSummary | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [data, setData] = useState<PaginatedRefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ioBusy, setIoBusy] = useState(false);
  const [ioMessage, setIoMessage] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const domains = await listReferenceDomains();
      const found = domains.find((d) => d.slug === domainSlug) ?? null;
      setDomainMeta(found);
      if (!found) {
        setMetaError('Unknown reference domain.');
      }
    } catch (err) {
      setMetaError(friendlyError(err));
      setDomainMeta(null);
    } finally {
      setMetaLoading(false);
    }
  }, [domainSlug]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listDomainReferences(domainSlug, {
        page,
        per_page: 25,
        search: search || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter,
      });
      setData(result);
    } catch (err) {
      setError(friendlyError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [domainSlug, page, search, isActiveFilter]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMeta();
    });
  }, [loadMeta]);

  useEffect(() => {
    if (!domainMeta) return;
    queueMicrotask(() => {
      void loadRecords();
    });
  }, [loadRecords, domainMeta]);

  const ops = domainMeta?.ops ?? [];
  const sampleRow = data?.items[0] ?? null;
  const columns = useMemo(() => columnKeysFromItems(data?.items ?? []), [data?.items]);

  const openView = async (row: ReferenceRow) => {
    if (!domainHasOp(ops, 'show') || row.id === undefined) {
      setModal({ mode: 'view', row });
      return;
    }
    setActionError(null);
    try {
      const full = await getDomainReference(domainSlug, row.id);
      setModal({ mode: 'view', row: full });
    } catch (err) {
      setActionError(friendlyError(err));
    }
  };

  const openEdit = async (row: ReferenceRow) => {
    if (row.id === undefined) return;
    setActionError(null);
    try {
      const full = domainHasOp(ops, 'show')
        ? await getDomainReference(domainSlug, row.id)
        : row;
      setModal({ mode: 'edit', row: full });
    } catch (err) {
      setActionError(friendlyError(err));
    }
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (!modal) return;
    setSaving(true);
    setActionError(null);
    try {
      if (modal.mode === 'create') {
        await createDomainReference(domainSlug, payload);
      } else if (modal.mode === 'edit' && modal.row.id !== undefined) {
        await updateDomainReference(domainSlug, modal.row.id, payload);
      }
      setModal(null);
      await loadRecords();
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ReferenceRow) => {
    if (row.id === undefined) return;
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    setActionError(null);
    try {
      await deleteDomainReference(domainSlug, row.id);
      await loadRecords();
    } catch (err) {
      setActionError(friendlyError(err));
    }
  };

  const handleToggle = async (row: ReferenceRow) => {
    if (row.id === undefined) return;
    setActionError(null);
    try {
      await toggleDomainReferenceActive(domainSlug, row.id);
      await loadRecords();
    } catch (err) {
      setActionError(friendlyError(err));
    }
  };

  const title = domainMeta?.title ?? domainSlug;

  const handleExport = async () => {
    setActionError(null);
    setIoMessage(null);
    setIoBusy(true);
    try {
      await exportDomainReference(domainSlug);
      setIoMessage('Export downloaded.');
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setIoBusy(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setActionError(null);
    setIoMessage(null);
    setIoBusy(true);
    try {
      const result = await importDomainReference(domainSlug, file);
      setIoMessage(result.message);
      await loadRecords();
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setIoBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/references"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Reference data
        </Link>
        <span className="text-border">/</span>
        <span className="truncate font-medium text-foreground">{title}</span>
      </nav>

      <AsyncState
        loading={metaLoading}
        error={metaError}
        empty={false}
        onRetry={() => void loadMeta()}
        skeleton={<TableSkeleton rows={8} columns={6} />}
      >
        <section aria-labelledby="domain-records-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="domain-records-heading" className="text-base font-semibold text-foreground">
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {domainSlug === 'icd10-codes' ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/icd10-cm" data-testid="icd10-cm-browser-link">
                    ICD-10-CM browser
                  </Link>
                </Button>
              ) : null}
              {domainHasOp(ops, 'export') ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={ioBusy}
                  onClick={() => void handleExport()}
                  data-testid="reference-export"
                >
                  Export JSON
                </Button>
              ) : null}
              {domainHasOp(ops, 'import') ? (
                <label
                  className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8125rem] font-medium shadow-xs transition-colors hover:bg-muted ${
                    ioBusy ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <span>{ioBusy ? 'Importing…' : 'Import file'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.json,.txt,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    disabled={ioBusy}
                    data-testid="reference-import"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      void handleImportFile(file);
                    }}
                  />
                </label>
              ) : null}
              {domainHasOp(ops, 'create') ? (
                <Button type="button" size="sm" onClick={() => setModal({ mode: 'create' })}>
                  New record
                </Button>
              ) : null}
            </div>
          </div>

          {ioMessage ? (
            <Alert className="border-success/30 bg-success/10 text-success">
              <AlertDescription>{ioMessage}</AlertDescription>
            </Alert>
          ) : null}

          <form
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <div className="relative min-w-[220px] flex-1 space-y-1.5">
              <Label htmlFor="reference-search" className="text-muted-foreground">
                Search
              </Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reference-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                  placeholder="Filter records…"
                />
              </div>
            </div>
            <div className="w-full space-y-1.5 sm:w-[160px]">
              <AppSelect
                id="reference-active-filter"
                label="Active"
                value={isActiveFilter}
                triggerClassName="w-full"
                onValueChange={(value) => {
                  setIsActiveFilter(value || 'all');
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="sm:mb-0.5">
              Apply
            </Button>
          </form>

          {actionError ? (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          ) : null}

          <AsyncState
            loading={loading}
            error={error}
            empty={!loading && !!data && data.items.length === 0}
            emptyMessage="No records match your filters."
            onRetry={() => void loadRecords()}
            skeleton={<TableSkeleton rows={8} columns={Math.max(columns.length, 5) + 1} />}
          >
            <div
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              data-testid="reference-records-table"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{formatColumnLabel(col)}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((row) => {
                    const rowKey = row.id ?? JSON.stringify(row);
                    return (
                      <TableRow key={String(rowKey)}>
                        {columns.map((col) => {
                          const value = formatCellValue(row[col]);
                          const isActiveCol = col === 'is_active';
                          return (
                            <TableCell
                              key={col}
                              className="max-w-[220px] truncate"
                              title={String(value)}
                            >
                              {isActiveCol ? (
                                <Badge
                                  variant="outline"
                                  className={
                                    value === 'Yes' || value === 'true' || value === '1'
                                      ? 'rounded-md border-transparent bg-success/10 text-success'
                                      : 'rounded-md'
                                  }
                                >
                                  {value === 'Yes' || value === 'true' || value === '1'
                                    ? 'Active'
                                    : value === 'No' || value === 'false' || value === '0'
                                      ? 'Inactive'
                                      : value}
                                </Badge>
                              ) : (
                                value
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {domainSlug === 'articles' && row.article_id != null ? (
                              <Button variant="outline" size="xs" asChild>
                                <Link
                                  href={`/dashboard/articles/${encodeURIComponent(String(row.article_id))}${
                                    row.article_version != null
                                      ? `?ver=${encodeURIComponent(String(row.article_version))}`
                                      : ''
                                  }`}
                                  data-testid={`article-open-${row.article_id}`}
                                >
                                  Open article
                                </Link>
                              </Button>
                            ) : null}
                            {domainHasOp(ops, 'show') ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => void openView(row)}
                              >
                                View
                              </Button>
                            ) : null}
                            {domainHasOp(ops, 'update') ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => void openEdit(row)}
                              >
                                Edit
                              </Button>
                            ) : null}
                            {domainHasOp(ops, 'toggle_active') ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => void handleToggle(row)}
                              >
                                Toggle
                              </Button>
                            ) : null}
                            {domainHasOp(ops, 'destroy') ? (
                              <Button
                                type="button"
                                variant="destructive"
                                size="xs"
                                onClick={() => void handleDelete(row)}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {data ? (
                <PaginationControls
                  page={data.meta.page}
                  lastPage={data.meta.last_page}
                  total={data.meta.total}
                  onPageChange={setPage}
                  className="px-3"
                  data-testid="reference-pagination"
                />
              ) : null}
            </div>
          </AsyncState>
        </section>
      </AsyncState>

      {modal ? (
        <RecordFormModal
          mode={modal.mode}
          domainSlug={domainSlug}
          sampleRow={sampleRow}
          initialRow={modal.mode === 'create' ? null : modal.row}
          saving={saving}
          onClose={() => setModal(null)}
          onSubmit={(payload) => void handleSubmit(payload)}
        />
      ) : null}
    </div>
  );
}
