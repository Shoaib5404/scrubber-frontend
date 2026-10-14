import { apiRequest } from '@/lib/api';
import type { PeriodFilterValue, TenantOverview } from '@/modules/team';
import { buildPeriodQuery } from '@/modules/team';

type ApiSuccess<T> = { success: boolean; message?: string; data: T };

export type AdminTenant = {
  id: number;
  name: string;
  slug: string;
  status: string;
  subscription_status: string;
  subscription_starts_at?: string | null;
  subscription_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  users_count?: number;
  batches_count?: number;
  features?: string[];
};

export type TenantFeatureMeta = {
  value: string;
  label: string;
  description: string;
  group: string;
};

export type PagedTenants = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  data: AdminTenant[];
};

export type TenantMember = {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  invite_pending?: boolean;
  invite_email_status?: string | null;
  invite_expires_at?: string | null;
};

export const DEFAULT_TENANT_FEATURES = [
  'web.upload',
  'api.access',
  'api.batches',
  'api.reference',
] as const;

export async function listTenants(page = 1, search = ''): Promise<PagedTenants> {
  const q = new URLSearchParams({
    page: String(page),
    per_page: '20',
  });
  if (search.trim()) q.set('search', search.trim());
  const res = await apiRequest<ApiSuccess<PagedTenants>>(
    'GET',
    `/admin/tenants?${q.toString()}`,
  );
  return res.data;
}

export async function getTenantFeatureCatalog(): Promise<TenantFeatureMeta[]> {
  const res = await apiRequest<ApiSuccess<TenantFeatureMeta[]>>(
    'GET',
    '/admin/tenants/feature-catalog',
  );
  return res.data;
}

export async function getTenant(id: number): Promise<AdminTenant> {
  const res = await apiRequest<ApiSuccess<AdminTenant>>('GET', `/admin/tenants/${id}`);
  return res.data;
}

export async function getTenantOverview(
  id: number,
  filter: PeriodFilterValue = { period: '1m' },
): Promise<TenantOverview> {
  const qs = buildPeriodQuery(filter);
  const res = await apiRequest<ApiSuccess<TenantOverview>>(
    'GET',
    `/admin/tenants/${id}/overview?${qs.toString()}`,
  );
  return res.data;
}

export async function createTenant(input: {
  name: string;
  slug?: string;
  subscription_status?: string;
  features?: string[];
  admin_email?: string;
  admin_name?: string;
}): Promise<{ tenant: AdminTenant; invite?: { invite_url?: string } }> {
  const res = await apiRequest<
    ApiSuccess<{ tenant: AdminTenant; invite?: { invite_url?: string } }>
  >('POST', '/admin/tenants', input);
  return res.data;
}

export async function updateTenant(
  id: number,
  input: {
    name?: string;
    status?: string;
    subscription_status?: string;
    features?: string[];
  },
): Promise<AdminTenant> {
  const res = await apiRequest<ApiSuccess<AdminTenant>>(
    'PATCH',
    `/admin/tenants/${id}`,
    input,
  );
  return res.data;
}

export async function listTenantUsers(tenantId: number): Promise<TenantMember[]> {
  const res = await apiRequest<ApiSuccess<TenantMember[]>>(
    'GET',
    `/admin/tenants/${tenantId}/users`,
  );
  return res.data;
}

export type InviteResult = {
  invite_url?: string;
  email_warning?: string;
  user?: { id: number; email: string; name: string; role: string; is_active: boolean };
};

export async function inviteTenantUser(
  tenantId: number,
  input: { email: string; name: string; role: string },
): Promise<InviteResult> {
  const res = await apiRequest<ApiSuccess<InviteResult>>(
    'POST',
    `/admin/tenants/${tenantId}/users`,
    input,
  );
  return res.data;
}

export async function resendTenantInvite(
  tenantId: number,
  email: string,
): Promise<InviteResult> {
  const res = await apiRequest<ApiSuccess<InviteResult>>(
    'POST',
    `/admin/tenants/${tenantId}/users/resend-invite`,
    { email },
  );
  return res.data;
}

/** When enabling API scope features, also enable api.access. */
export function withImpliedApiAccess(features: string[]): string[] {
  const set = new Set(features);
  if (set.has('api.batches') || set.has('api.reference')) {
    set.add('api.access');
  }
  return [...set];
}
