'use client';

import { useMemo, useState } from 'react';
import {
  columnKeysFromItems,
  formatCellValue,
  resolveFormFields,
  type FieldHint,
} from '../field-hints';
import type { ReferenceRow } from '../types';

type RecordFormModalProps = {
  mode: 'create' | 'edit' | 'view';
  domainSlug: string;
  sampleRow: ReferenceRow | null;
  initialRow: ReferenceRow | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
};

function rowToFormValues(row: ReferenceRow | null, fields: FieldHint[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const raw = row?.[field.key];
    if (field.type === 'boolean') {
      values[field.key] = raw === true || raw === 'true' ? 'true' : 'false';
    } else if (raw === null || raw === undefined) {
      values[field.key] = '';
    } else {
      values[field.key] = String(raw);
    }
  }
  return values;
}

function payloadFromForm(
  fields: FieldHint[],
  values: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.key] ?? '';
    if (field.type === 'boolean') {
      payload[field.key] = raw === 'true';
    } else if (field.type === 'number') {
      if (raw.trim() === '') continue;
      payload[field.key] = Number(raw);
    } else if (raw.trim() !== '') {
      payload[field.key] = raw;
    } else if (field.required) {
      payload[field.key] = raw;
    }
  }
  return payload;
}

function RecordFormModalBody({
  mode,
  domainSlug,
  sampleRow,
  initialRow,
  saving,
  onClose,
  onSubmit,
}: RecordFormModalProps) {
  const fields = useMemo(
    () =>
      resolveFormFields(
        domainSlug,
        sampleRow,
        mode === 'create' ? null : initialRow,
      ),
    [domainSlug, sampleRow, initialRow, mode],
  );

  const [values, setValues] = useState(() =>
    rowToFormValues(mode === 'create' ? null : initialRow, fields),
  );

  const title =
    mode === 'create' ? 'Create record' : mode === 'edit' ? 'Edit record' : 'Record details';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-form-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="record-form-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {mode === 'view' && initialRow ? (
          <dl className="divide-y divide-slate-100 px-4 py-2 text-sm">
            {columnKeysFromItems([initialRow]).map((key) => (
              <div key={key} className="grid grid-cols-3 gap-2 py-2">
                <dt className="font-medium text-slate-500">{key}</dt>
                <dd className="col-span-2 break-all text-slate-900">
                  {formatCellValue(initialRow[key])}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <form
            className="space-y-3 px-4 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(payloadFromForm(fields, values));
            }}
          >
            {fields.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  {field.label}
                  {field.required ? ' *' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.key] ?? ''}
                    onChange={(ev) =>
                      setValues((prev) => ({ ...prev, [field.key]: ev.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  />
                ) : field.type === 'boolean' ? (
                  <select
                    value={values[field.key] ?? 'false'}
                    onChange={(ev) =>
                      setValues((prev) => ({ ...prev, [field.key]: ev.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={values[field.key] ?? ''}
                    required={field.required}
                    onChange={(ev) =>
                      setValues((prev) => ({ ...prev, [field.key]: ev.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  />
                )}
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function RecordFormModal(props: RecordFormModalProps) {
  const resetKey = `${props.mode}-${props.initialRow?.id ?? 'new'}`;
  return <RecordFormModalBody key={resetKey} {...props} />;
}
