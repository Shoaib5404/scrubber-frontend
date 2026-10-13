import { apiRequest } from '@/lib/api';

type ApiSuccess<T> = { success: boolean; message?: string; data: T };

export type TenantMemberRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
};

export async function listMyTenantMembers(): Promise<TenantMemberRow[]> {
  const res = await apiRequest<ApiSuccess<TenantMemberRow[]>>('GET', '/tenant/members');
  return res.data;
}

export async function inviteMyTenantMember(input: {
  email: string;
  name: string;
  role: string;
}): Promise<void> {
  await apiRequest('POST', '/tenant/members', input);
}

export async function resendMyTenantInvite(email: string): Promise<void> {
  await apiRequest('POST', '/tenant/members/resend-invite', { email });
}
