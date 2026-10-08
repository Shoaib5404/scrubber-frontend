'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
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

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit' | 'view'; row: ReferenceRow }
  | null;

export function DomainRecords({ domainSlug }: DomainRecordsProps) {
  const [domainMeta, setDomainMeta] = useState<DomainSummary | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
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
        is_active: isActiveFilter || undefined,
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
      <p className="text-sm text-slate-600">
        <Link href="/dashboard/references" className="underline-offset-2 hover:underline">
          Reference data
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900">{title}</span>
      </p>

      <AsyncState
        loading={metaLoading}
        error={metaError}
        empty={false}
        onRetry={() => void loadMeta()}
      >
        <section aria-labelledby="domain-records-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="domain-records-heading" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {domainHasOp(ops, 'export') ? (
                <button
                  type="button"
                  disabled={ioBusy}
                  onClick={() => void handleExport()}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                  data-testid="reference-export"
                >
                  Export JSON
                </button>
              ) : null}
              {domainHasOp(ops, 'import') ? (
                <label className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 has-[:disabled]:opacity-50">
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
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'create' })}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                >
                  New record
                </button>
              ) : null}
            </div>
          </div>

          {ioMessage ? (
            <div
              className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              role="status"
            >
              {ioMessage}
            </div>
          ) : null}

          <form
            className="mb-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Search</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="Filter records…"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Active</span>
              <select
                value={isActiveFilter}
                onChange={(e) => {
                  setIsActiveFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Apply
            </button>
          </form>

          {actionError ? (
            <div
              className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {actionError}
            </div>
          ) : null}

          {data ? (
            <p className="mb-2 text-xs text-slate-500" data-testid="reference-pagination">
              Page {data.meta.page} of {data.meta.last_page} · {data.meta.total} total
            </p>
          ) : null}

          <AsyncState
            loading={loading}
            error={error}
            empty={!loading && !!data && data.items.length === 0}
            emptyMessage="No records match your filters."
            onRetry={() => void loadRecords()}
          >
            <div
              className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"
              data-testid="reference-records-table"
            >
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2 font-medium">
                        {col}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items.map((row) => {
                    const rowKey = row.id ?? JSON.stringify(row);
                    return (
                      <tr key={String(rowKey)} className="hover:bg-slate-50">
                        {columns.map((col) => (
                          <td key={col} className="max-w-xs truncate px-3 py-2 text-slate-700">
                            {formatCellValue(row[col])}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {domainHasOp(ops, 'show') ? (
                              <button
                                type="button"
                                onClick={() => void openView(row)}
                                className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                              >
                                View
                              </button>
                            ) : null}
                            {domainHasOp(ops, 'update') ? (
                              <button
                                type="button"
                                onClick={() => void openEdit(row)}
                                className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                              >
                                Edit
                              </button>
                            ) : null}
                            {domainHasOp(ops, 'toggle_active') ? (
                              <button
                                type="button"
                                onClick={() => void handleToggle(row)}
                                className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                              >
                                Toggle active
                              </button>
                            ) : null}
                            {domainHasOp(ops, 'destroy') ? (
                              <button
                                type="button"
                                onClick={() => void handleDelete(row)}
                                className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-800 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data && data.meta.last_page > 1 ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= data.meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
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
