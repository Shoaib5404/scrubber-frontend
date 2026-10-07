export type FieldInputType = 'text' | 'textarea' | 'number' | 'boolean' | 'date';

export type FieldHint = {
  key: string;
  label: string;
  type: FieldInputType;
  required?: boolean;
};

/** Known writable fields for Wave A domains (snake_case keys). */
export const FIELD_HINTS: Record<string, FieldHint[]> = {
  'cpt-codes': [
    { key: 'name', label: 'CPT code', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'effective_date', label: 'Effective date', type: 'date' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
};

const EXCLUDED_FORM_KEYS = new Set(['id', 'created_at', 'updated_at']);

function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferInputType(key: string, value: unknown): FieldInputType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (key.endsWith('_date') || key.includes('effective')) return 'date';
  if (key === 'description' || key === 'notes') return 'textarea';
  return 'text';
}

function isScalarFieldValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function resolveFormFields(
  domainSlug: string,
  sampleRow: Record<string, unknown> | null,
  editRow: Record<string, unknown> | null,
): FieldHint[] {
  const hinted = FIELD_HINTS[domainSlug];
  if (hinted) return hinted;

  const source = editRow ?? sampleRow;
  if (!source) {
    return [{ key: 'name', label: 'Name', type: 'text', required: true }];
  }

  return Object.keys(source)
    .filter((key) => !EXCLUDED_FORM_KEYS.has(key) && isScalarFieldValue(source[key]))
    .map((key) => ({
      key,
      label: humanizeKey(key),
      type: inferInputType(key, source[key]),
    }));
}

export function columnKeysFromItems(items: Record<string, unknown>[]): string[] {
  if (items.length === 0) return ['id'];
  const keys = new Set<string>();
  for (const row of items.slice(0, 5)) {
    for (const key of Object.keys(row)) {
      if (isScalarFieldValue(row[key]) || key === 'id') {
        keys.add(key);
      }
    }
  }
  const ordered = ['id', ...[...keys].filter((k) => k !== 'id').sort()];
  return ordered;
}

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
