import { apiRequest } from '@/lib/api';
import type { BatchSummary } from '@/modules/batches';
import type {
  CustomerDashboardStats,
  PeriodFilterValue,
  StaffDashboardActivity,
  StaffDashboardStats,
} from './types';
import { buildPeriodQuery } from './types';

type ApiSuccess<T> = { success: boolean; data: T };

export async function fetchStaffDashboardStats(
  filter: PeriodFilterValue = { period: '1m' },
): Promise<StaffDashboardStats> {
  const qs = buildPeriodQuery(filter);
  const res = await apiRequest<ApiSuccess<StaffDashboardStats>>(
    'GET',
    `/staff/dashboard/stats?${qs.toString()}`,
  );
  return res.data;
}

export async function fetchStaffDashboardActivity(
  limit = 10,
): Promise<StaffDashboardActivity> {
  const qs = new URLSearchParams({ limit: String(limit) });
  const res = await apiRequest<ApiSuccess<StaffDashboardActivity>>(
    'GET',
    `/staff/dashboard/activity?${qs.toString()}`,
  );
  return res.data;
}

export async function fetchCustomerDashboardStats(
  filter: PeriodFilterValue = { period: '1m' },
): Promise<CustomerDashboardStats> {
  const qs = buildPeriodQuery(filter);
  const res = await apiRequest<ApiSuccess<CustomerDashboardStats>>(
    'GET',
    `/dashboard/stats?${qs.toString()}`,
  );
  return res.data;
}

export async function fetchCustomerRecentBatches(
  limit = 10,
): Promise<BatchSummary[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  const res = await apiRequest<ApiSuccess<BatchSummary[]>>(
    'GET',
    `/dashboard/recent-batches?${qs.toString()}`,
  );
  return res.data;
}
