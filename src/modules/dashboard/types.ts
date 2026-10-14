import type { BatchSummary } from '@/modules/batches';

export type DashboardPeriod =
  | 'today'
  | '7d'
  | '1w'
  | '1m'
  | '30d'
  | 'all'
  | 'custom';

export type PeriodFilterValue = {
  period: DashboardPeriod;
  from?: string;
  to?: string;
};

export type BatchStatusCounts = {
  total: number;
  pending: number;
  processing: number;
  parsed: number;
  validating: number;
  validated: number;
  exported: number;
  error: number;
};

export type ClaimStatusCounts = {
  total: number;
  pending: number;
  valid: number;
  warning: number;
  error: number;
};

export type StaffDashboardStats = {
  period: DashboardPeriod;
  period_start: string | null;
  period_end: string;
  tenants: { total: number; active: number; suspended: number };
  users: { total_staff: number; total_tenant_users: number };
  batches: BatchStatusCounts;
  claims: ClaimStatusCounts;
};

export type StaffDashboardActivity = {
  recent_batches: BatchSummary[];
  recent_tenants: Array<{
    id: number;
    name: string;
    slug: string;
    status: string;
    created_at: string;
  }>;
  recent_upload_errors: Array<{
    id: number;
    tenant_id: number | null;
    tenant_name: string | null;
    tenant_slug: string | null;
    original_filename: string | null;
    status: string;
    error_type: string | null;
    created_at: string;
  }>;
};

export type CustomerDashboardStats = {
  period: DashboardPeriod;
  period_start: string | null;
  period_end: string;
  tenant: {
    id: number;
    name: string;
    slug: string;
    status: string;
    subscription_status: string;
  } | null;
  users: { company_user_count: number };
  batches: BatchStatusCounts;
  claims: ClaimStatusCounts;
};

/** Presets shown in the period selector (excludes legacy `30d` alias). */
export const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all', label: 'All time' },
];

export function isDashboardPeriod(value: string): value is DashboardPeriod {
  return PERIOD_OPTIONS.some((o) => o.value === value) || value === '30d';
}

export function periodCaption(value: PeriodFilterValue): string {
  if (value.period === 'custom' && value.from && value.to) {
    return `Metrics for: ${value.from} → ${value.to}`;
  }
  if (value.period === 'custom' && value.from) {
    return `Metrics for: from ${value.from}`;
  }
  const opt = PERIOD_OPTIONS.find((o) => o.value === value.period);
  if (opt) return `Metrics for: ${opt.label}`;
  if (value.period === '30d') return 'Metrics for: 1 month';
  return `Metrics for: ${value.period}`;
}

export function buildPeriodQuery(value: PeriodFilterValue): URLSearchParams {
  const qs = new URLSearchParams({ period: value.period });
  if (value.period === 'custom') {
    if (value.from) qs.set('from', value.from);
    if (value.to) qs.set('to', value.to);
  }
  return qs;
}

/** Default custom range draft: last 7 calendar days (YYYY-MM-DD). */
export function defaultCustomRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

function toDateInputValue(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
