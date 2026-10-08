import { apiRequest } from '@/lib/api';

type ApiSuccess<T> = { success: boolean; message?: string; data: T };

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  plan: string | null;
  subscription_status: string;
};

export type AdminApiClient = {
  id: number;
  name: string;
  client_id: string;
  user_id: number | null;
  is_active: boolean;
  plain_client_secret?: string;
};

export type PagedUsers = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  data: AdminUser[];
};

export async function listUsers(page = 1): Promise<PagedUsers> {
  const res = await apiRequest<ApiSuccess<PagedUsers>>(
    'GET',
    `/admin/users?page=${page}&per_page=20`,
  );
  return res.data;
}

export async function getUser(id: number): Promise<AdminUser> {
  const res = await apiRequest<ApiSuccess<AdminUser>>('GET', `/admin/users/${id}`);
  return res.data;
}

export async function getUserApiClient(id: number): Promise<AdminApiClient | null> {
  const res = await apiRequest<ApiSuccess<AdminApiClient | null>>(
    'GET',
    `/admin/users/${id}/api-clients`,
  );
  return res.data;
}

export async function createUserApiClient(
  id: number,
  name: string,
): Promise<AdminApiClient> {
  const res = await apiRequest<ApiSuccess<AdminApiClient>>(
    'POST',
    `/admin/users/${id}/api-clients`,
    { name },
  );
  return res.data;
}

export async function rotateUserApiClient(
  userId: number,
  clientId: number,
): Promise<AdminApiClient> {
  const res = await apiRequest<ApiSuccess<AdminApiClient>>(
    'POST',
    `/admin/users/${userId}/api-clients/${clientId}/rotate`,
  );
  return res.data;
}

export async function revokeUserApiClient(userId: number, clientId: number): Promise<void> {
  await apiRequest('POST', `/admin/users/${userId}/api-clients/${clientId}/revoke`);
}
