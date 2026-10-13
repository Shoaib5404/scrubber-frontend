import { apiRequest } from '@/lib/api';

type ApiSuccess<T> = { success: boolean; message?: string; data: T };

export type ServiceClientScopeMeta = {
  value: string;
  label: string;
  description: string;
};

export type PlatformServiceClient = {
  id: number;
  name: string;
  client_id: string;
  user_id: number | null;
  tenant_id: number | null;
  is_active: boolean;
  scopes: string[] | null;
  last_used_at: string | null;
  created_at: string;
  kind?: 'platform_service';
  plain_client_secret?: string;
};

export type PagedServiceClients = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  data: PlatformServiceClient[];
};

export async function getServiceClientScopeCatalog(): Promise<ServiceClientScopeMeta[]> {
  const res = await apiRequest<ApiSuccess<ServiceClientScopeMeta[]>>(
    'GET',
    '/admin/service-clients/scope-catalog',
  );
  return res.data;
}

export async function listServiceClients(page = 1, search = ''): Promise<PagedServiceClients> {
  const q = new URLSearchParams({
    page: String(page),
    per_page: '20',
  });
  if (search.trim()) q.set('search', search.trim());
  const res = await apiRequest<ApiSuccess<PagedServiceClients>>(
    'GET',
    `/admin/service-clients?${q.toString()}`,
  );
  return res.data;
}

export async function createServiceClient(input: {
  name: string;
  scopes: string[];
}): Promise<PlatformServiceClient> {
  const res = await apiRequest<ApiSuccess<PlatformServiceClient>>(
    'POST',
    '/admin/service-clients',
    input,
  );
  return res.data;
}

export async function rotateServiceClient(id: number): Promise<PlatformServiceClient> {
  const res = await apiRequest<ApiSuccess<PlatformServiceClient>>(
    'POST',
    `/admin/service-clients/${id}/rotate`,
  );
  return res.data;
}

export async function reissueServiceClient(
  id: number,
  name?: string,
): Promise<PlatformServiceClient> {
  const res = await apiRequest<ApiSuccess<PlatformServiceClient>>(
    'POST',
    `/admin/service-clients/${id}/reissue`,
    name ? { name } : {},
  );
  return res.data;
}

export async function revokeServiceClient(id: number): Promise<{ revoked: boolean }> {
  const res = await apiRequest<ApiSuccess<{ revoked: boolean }>>(
    'POST',
    `/admin/service-clients/${id}/revoke`,
  );
  return res.data;
}
