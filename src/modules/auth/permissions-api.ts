import { apiRequest } from '@/lib/api/client';

export type PermissionMeta = {
  value: string;
  label: string;
  description: string;
  group: string;
};

export type PermissionsMatrixData = {
  roles: string[];
  catalog: PermissionMeta[];
  grouped: Record<string, PermissionMeta[]>;
  selected: Record<string, string[]>;
};

export async function getPermissionsMatrix(): Promise<PermissionsMatrixData> {
  const res = await apiRequest<{ success: boolean; data: PermissionsMatrixData }>(
    'GET',
    '/admin/permissions',
  );
  return res.data;
}

export async function updatePermissionsMatrix(
  permissions: Record<string, string[]>,
): Promise<{ selected: Record<string, string[]> }> {
  const res = await apiRequest<{
    success: boolean;
    message: string;
    data: { selected: Record<string, string[]> };
  }>('PUT', '/admin/permissions', { permissions });
  return res.data;
}
