import type { BatchSummary } from '@/modules/batches';
import type { BatchStatusCounts, ClaimStatusCounts, DashboardPeriod } from '@/modules/dashboard/types';

export type MemberActivity = {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  invite_pending?: boolean;
  invite_email_status?: string | null;
  invite_expires_at?: string | null;
  batches_uploaded: number;
  batches_error: number;
  claims_total: number;
  claims_error: number;
  last_upload_at: string | null;
};

export type TenantOverviewStats = {
  batches: BatchStatusCounts;
  claims: ClaimStatusCounts;
  users: { company_user_count: number };
};

export type TenantOverview = {
  tenant: {
    id: number;
    name: string;
    slug: string;
    status: string;
    subscription_status: string;
    features?: string[];
    users_count?: number;
    batches_count?: number;
    subscription_starts_at?: string | null;
    subscription_ends_at?: string | null;
  };
  period: DashboardPeriod;
  period_start: string | null;
  period_end: string;
  stats: TenantOverviewStats;
  members: MemberActivity[];
  recent_batches: BatchSummary[];
};

export {
  PERIOD_OPTIONS,
  periodCaption,
  buildPeriodQuery,
} from '@/modules/dashboard/types';
export type {
  DashboardPeriod,
  PeriodFilterValue,
} from '@/modules/dashboard/types';
