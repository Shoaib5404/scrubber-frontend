import { apiRequest } from '@/lib/api';

type ApiSuccess<T> = { success: boolean; data: T };

export type AuditCategoryRow = {
  code: string;
  label: string;
  description: string;
  group: string;
  enabled: boolean;
  updated_at: string;
  updated_by_user_id: number | null;
};

export type AuditEventRow = {
  id: number;
  occurred_at: string;
  category_code: string;
  category_label: string;
  category_group: string;
  action: string;
  actor_type: string;
  actor_user_id: number | null;
  actor_role: string | null;
  actor_user: { id: number; name: string; email: string } | null;
  tenant_id: number | null;
  tenant: { id: number; name: string; slug: string } | null;
  resource_type: string | null;
  resource_id: string | null;
  request_id: string | null;
  ip: string | null;
  metadata: unknown;
};

export type AuditEventsPage = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  data: AuditEventRow[];
};

export type ListAuditEventsParams = {
  page?: number;
  per_page?: number;
  category?: string;
  action?: string;
  tenant_id?: number;
  from?: string;
  to?: string;
};

function toQuery(params: ListAuditEventsParams): string {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 1));
  q.set('per_page', String(params.per_page ?? 25));
  if (params.category) q.set('category', params.category);
  if (params.action) q.set('action', params.action);
  if (params.tenant_id != null) q.set('tenant_id', String(params.tenant_id));
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  return q.toString();
}

export async function listAdminAuditEvents(
  params: ListAuditEventsParams = {},
): Promise<AuditEventsPage> {
  const res = await apiRequest<ApiSuccess<AuditEventsPage>>(
    'GET',
    `/admin/audit/events?${toQuery(params)}`,
  );
  return res.data;
}

export async function listPortalAuditEvents(
  params: ListAuditEventsParams = {},
): Promise<AuditEventsPage> {
  const safe = { ...params };
  delete safe.tenant_id;
  const res = await apiRequest<ApiSuccess<AuditEventsPage>>(
    'GET',
    `/audit/events?${toQuery(safe)}`,
  );
  return res.data;
}

export async function listAuditCategories(): Promise<AuditCategoryRow[]> {
  const res = await apiRequest<ApiSuccess<AuditCategoryRow[]>>(
    'GET',
    '/admin/audit/categories',
  );
  return res.data;
}

export async function setAuditCategoryEnabled(
  code: string,
  enabled: boolean,
): Promise<AuditCategoryRow> {
  const res = await apiRequest<ApiSuccess<AuditCategoryRow>>(
    'PATCH',
    `/admin/audit/categories/${encodeURIComponent(code)}`,
    { enabled },
  );
  return res.data;
}
