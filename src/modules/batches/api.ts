import { apiRequest } from '@/lib/api';
import type {
  ApiSuccess,
  BatchStatistics,
  BatchSummary,
  BatchUploadResult,
  BatchValidateResult,
  ClaimSummary,
  LaravelPaginator,
} from './types';

export type ListBatchesParams = {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
};

export async function listBatches(
  params: ListBatchesParams = {},
): Promise<LaravelPaginator<BatchSummary>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();
  const res = await apiRequest<ApiSuccess<LaravelPaginator<BatchSummary>>>(
    'GET',
    `/batches${query ? `?${query}` : ''}`,
  );
  return res.data;
}

export async function getBatch(
  id: number,
): Promise<{ batch: BatchSummary; statistics: BatchStatistics }> {
  const res = await apiRequest<
    ApiSuccess<{ batch: BatchSummary; statistics: BatchStatistics }>
  >('GET', `/batches/${id}`);
  return res.data;
}

export async function getBatchStatistics(id: number): Promise<BatchStatistics> {
  const res = await apiRequest<ApiSuccess<BatchStatistics>>(
    'GET',
    `/batches/${id}/statistics`,
  );
  return res.data;
}

export async function uploadBatch(file: File): Promise<BatchUploadResult> {
  const form = new FormData();
  form.append('edi_file', file);
  const res = await apiRequest<ApiSuccess<BatchUploadResult>>('POST', '/batches', form);
  return res.data;
}

export async function deleteBatch(id: number): Promise<void> {
  await apiRequest<ApiSuccess<unknown>>('DELETE', `/batches/${id}`);
}

export async function validateBatch(
  id: number,
  force = false,
): Promise<{ httpStatusHint?: number; body: ApiSuccess<BatchValidateResult> }> {
  const body = await apiRequest<ApiSuccess<BatchValidateResult>>(
    'POST',
    `/batches/${id}/validate`,
    { force },
  );
  return { body };
}

export async function listBatchClaims(
  batchId: number,
  params: { page?: number; per_page?: number; status?: string; search?: string } = {},
): Promise<LaravelPaginator<ClaimSummary>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();
  const res = await apiRequest<ApiSuccess<LaravelPaginator<ClaimSummary>>>(
    'GET',
    `/batches/${batchId}/claims${query ? `?${query}` : ''}`,
  );
  return res.data;
}

export async function getClaim(id: number): Promise<ClaimSummary> {
  const res = await apiRequest<ApiSuccess<ClaimSummary>>('GET', `/claims/${id}`);
  return res.data;
}

export async function validateClaim(id: number): Promise<unknown> {
  const res = await apiRequest<ApiSuccess<unknown>>('POST', `/claims/${id}/validate`);
  return res.data;
}
