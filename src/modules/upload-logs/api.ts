import { apiRequest } from '@/lib/api';

type ApiSuccess<T> = { success: boolean; data: T };

export type UploadLogRow = {
  id: number;
  user_id: number;
  original_filename: string | null;
  status: string;
  error_type: string | null;
  error_message: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string } | null;
};

export type UploadLogsPage = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  show_user_column: boolean;
  data: UploadLogRow[];
};

export async function listUploadLogs(page = 1): Promise<UploadLogsPage> {
  const res = await apiRequest<ApiSuccess<UploadLogsPage>>(
    'GET',
    `/upload-logs?page=${page}&per_page=25`,
  );
  return res.data;
}
