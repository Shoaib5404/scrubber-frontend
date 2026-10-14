import { apiRequest, apiRequestWithMeta } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api/config';
import {
  ApiClientError,
  networkError,
  normalizeApiErrorPayload,
  type ApiErrorPayload,
} from '@/lib/api/errors';
import { refreshAccessToken } from '@/lib/auth/session-refresh';
import { tokenManager } from '@/lib/auth/token-manager';
import {
  ACCOUNT_DEACTIVATED_MESSAGE,
  AUTH_REASON_STORAGE_KEY,
} from '@/modules/auth/types';
import type {
  ApiSuccess,
  BatchStatistics,
  BatchStatusPoll,
  BatchSummary,
  BatchUploadResult,
  BatchValidateResult,
  ClaimSummary,
  ClaimValidateResult,
  LengthAwarePaginator,
} from './types';

export type ListBatchesParams = {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  /** Staff-only tenant filter. */
  tenant_id?: number;
};

export async function listBatches(
  params: ListBatchesParams = {},
): Promise<LengthAwarePaginator<BatchSummary>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.date_from) qs.set('date_from', params.date_from);
  if (params.date_to) qs.set('date_to', params.date_to);
  if (params.tenant_id != null && params.tenant_id > 0) {
    qs.set('tenant_id', String(params.tenant_id));
  }
  const query = qs.toString();
  const res = await apiRequest<ApiSuccess<LengthAwarePaginator<BatchSummary>>>(
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

export type BatchUploadUrlPayload = {
  url: string;
  objectKey: string;
  expiresIn: number;
  headers?: Record<string, string>;
};

/** TeleWound-style initiate — Nest mints object key + presigned MinIO PUT URL. */
export async function requestBatchUploadUrl(params: {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<BatchUploadUrlPayload> {
  const res = await apiRequest<ApiSuccess<BatchUploadUrlPayload>>(
    'POST',
    '/batches/upload-url',
    {
      originalFilename: params.originalFilename,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    },
  );
  return res.data;
}

/** PUT file bytes directly to MinIO using the presigned URL (no Nest auth header). */
export async function putEdiToStorage(
  url: string,
  file: File,
  headers: Record<string, string> = {},
  onProgress?: (pct: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        new ApiClientError(
          "We couldn't upload the file. Please try again.",
          xhr.status,
          "We couldn't upload the file. Please try again.",
          { code: 'FILE_UPLOAD_FAILED', retryable: xhr.status >= 500 || xhr.status === 0 },
        ),
      );
    };
    xhr.onerror = () => {
      reject(networkError(new Error('Network error uploading to object storage')));
    };
    xhr.onabort = () => {
      reject(new ApiClientError('Upload cancelled', 0, 'Upload cancelled'));
    };
    xhr.send(file);
  });
}

/** Finalize after MinIO PUT — Nest verifies object, validates EDI, creates BatchFile. */
export async function completeBatchUpload(params: {
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<BatchUploadResult> {
  const res = await apiRequest<ApiSuccess<BatchUploadResult>>(
    'POST',
    '/batches/complete',
    {
      objectKey: params.objectKey,
      originalFilename: params.originalFilename,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    },
  );
  return res.data;
}

/** Presigned browser → MinIO PUT → Nest complete (TeleWound-aligned). */
export async function uploadBatch(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<BatchUploadResult> {
  const mimeType = file.type || 'application/EDI-X12';
  const signed = await requestBatchUploadUrl({
    originalFilename: file.name,
    mimeType,
    sizeBytes: file.size,
  });
  await putEdiToStorage(
    signed.url,
    file,
    signed.headers ?? { 'Content-Type': mimeType },
    onProgress,
  );
  return completeBatchUpload({
    objectKey: signed.objectKey,
    originalFilename: file.name,
    mimeType,
    sizeBytes: file.size,
  });
}

export async function deleteBatch(id: number): Promise<void> {
  await apiRequest<ApiSuccess<unknown>>('DELETE', `/batches/${id}`);
}

export async function getBatchStatus(id: number): Promise<BatchStatusPoll> {
  return apiRequest<BatchStatusPoll>('GET', `/batches/${id}/status`);
}

export async function validateBatch(
  id: number,
  force = false,
): Promise<{ httpStatus: number; body: ApiSuccess<BatchValidateResult> }> {
  const { status, data } = await apiRequestWithMeta<ApiSuccess<BatchValidateResult>>(
    'POST',
    `/batches/${id}/validate`,
    { force },
  );
  if (!data || typeof data !== 'object' || !('data' in data)) {
    throw new ApiClientError(
      'Unexpected validate response',
      status,
      'Validate response missing data',
    );
  }
  return { httpStatus: status, body: data };
}

export async function listBatchClaims(
  batchId: number,
  params: { page?: number; per_page?: number; status?: string; search?: string } = {},
): Promise<LengthAwarePaginator<ClaimSummary>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();
  const res = await apiRequest<ApiSuccess<LengthAwarePaginator<ClaimSummary>>>(
    'GET',
    `/batches/${batchId}/claims${query ? `?${query}` : ''}`,
  );
  return res.data;
}

export async function getClaim(id: number): Promise<ClaimSummary> {
  const res = await apiRequest<ApiSuccess<ClaimSummary>>('GET', `/claims/${id}`);
  return res.data;
}

export async function updateClaim(
  id: number,
  body: Record<string, unknown>,
): Promise<ClaimSummary> {
  const res = await apiRequest<ApiSuccess<ClaimSummary>>('PUT', `/claims/${id}`, body);
  return res.data;
}

export async function validateClaim(id: number): Promise<ClaimValidateResult> {
  const res = await apiRequest<ApiSuccess<ClaimValidateResult>>(
    'POST',
    `/claims/${id}/validate`,
  );
  return res.data;
}

export type BatchEdiViewerPayload = {
  text: string;
  filename: string;
};

/** Authenticated text/plain EDI fetch for in-app display. */
export async function fetchBatchEdiViewer(
  id: number,
  alreadyRetried = false,
): Promise<BatchEdiViewerPayload> {
  const headers = new Headers();
  const accessToken = tokenManager.getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/batches/${id}/edi/viewer`, {
      method: 'GET',
      headers,
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // non-JSON error body
    }
    const normalized = normalizeApiErrorPayload(payload, {
      status: response.status,
      statusText: response.statusText || 'Failed to load EDI file',
    });
    const detectionMessage = normalized.rawMessage ?? normalized.userMessage;

    if (response.status === 401 && !alreadyRetried) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return fetchBatchEdiViewer(id, true);
      }
      if (
        typeof window !== 'undefined' &&
        (detectionMessage === ACCOUNT_DEACTIVATED_MESSAGE ||
          detectionMessage.toLowerCase().includes('account has been deactivated') ||
          detectionMessage.toLowerCase().includes('account is inactive'))
      ) {
        try {
          sessionStorage.setItem(AUTH_REASON_STORAGE_KEY, 'deactivated');
        } catch {
          // ignore storage failures
        }
      }
      tokenManager.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scrubber:auth-expired'));
      }
      throw ApiClientError.fromNormalized(normalized);
    }

    if (response.status === 401 && alreadyRetried) {
      tokenManager.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scrubber:auth-expired'));
      }
    }

    // 403: keep session — viewer forbidden is not a logout.
    throw ApiClientError.fromNormalized(normalized);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] ?? `batch-${id}.edi`;
  const text = await response.text();
  return { text, filename };
}
