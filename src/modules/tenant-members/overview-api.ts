import { apiRequest } from '@/lib/api';
import type { PeriodFilterValue, TenantOverview } from '@/modules/team';
import { buildPeriodQuery } from '@/modules/team';

type ApiSuccess<T> = { success: boolean; data: T };

export async function fetchTenantSelfOverview(
  filter: PeriodFilterValue = { period: '1m' },
): Promise<TenantOverview> {
  const qs = buildPeriodQuery(filter);
  const res = await apiRequest<ApiSuccess<TenantOverview>>(
    'GET',
    `/tenant/overview?${qs.toString()}`,
  );
  return res.data;
}
