import { apiRequest } from '@/lib/api';

export type CodingRefItem = { code: string; description: string | null };

export type CptSummary = {
  id: number;
  code: string;
  description: string | null;
  status: string;
  is_active: boolean;
  effective_date: string | null;
};

export type CptTabPayload = {
  tab: string;
  code: string;
  columns: Array<{ key: string; label: string; highlight?: boolean }>;
  rows: Array<Record<string, unknown>>;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message?: string;
};

export async function searchReference(
  kind: 'cpt' | 'icd10' | 'modifiers',
  q: string,
  limit = 10,
): Promise<CodingRefItem[]> {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  const res = await apiRequest<{
    success: boolean;
    data: { items: CodingRefItem[]; limit: number };
  }>('GET', `/reference/${kind}/search?${qs.toString()}`);
  return res.data.items;
}

export async function cptExactSearch(code: string): Promise<CptSummary> {
  const qs = new URLSearchParams({ code });
  return apiRequest<CptSummary>('GET', `/cpt-search?${qs.toString()}`);
}

export async function getCptSummary(code: string): Promise<CptSummary> {
  return apiRequest<CptSummary>('GET', `/cpt/${encodeURIComponent(code)}`);
}

export async function getCptTab(
  code: string,
  tab: string,
  page = 1,
): Promise<CptTabPayload> {
  const qs = new URLSearchParams({ page: String(page), per_page: '25' });
  return apiRequest<CptTabPayload>(
    'GET',
    `/cpt/${encodeURIComponent(code)}/${encodeURIComponent(tab)}?${qs.toString()}`,
  );
}

export const CPT_TABS: Array<{ key: string; label: string }> = [
  { key: 'age-specific', label: 'Age' },
  { key: 'gender-specific', label: 'Gender' },
  { key: 'pos', label: 'POS' },
  { key: 'modifiers', label: 'Modifiers' },
  { key: 'ncci', label: 'NCCI' },
  { key: 'add-on', label: 'Add-on' },
  { key: 'mue', label: 'MUE' },
  { key: 'ncd-other', label: 'NCD' },
  { key: 'anesthesia', label: 'Anesthesia' },
  { key: 'anesthesia-modifiers', label: 'Anesthesia mods' },
  { key: 'i-codes', label: 'I-codes' },
  { key: 'major-surgery-codes', label: 'Major surgery' },
  { key: 'initial-treatment-codes', label: 'Initial treatment' },
];
