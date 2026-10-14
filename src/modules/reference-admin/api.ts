import { apiRequest } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api/config';
import {
  ApiClientError,
  networkError,
  normalizeApiErrorPayload,
  type ApiErrorPayload,
} from '@/lib/api/errors';
import { tokenManager } from '@/lib/auth/token-manager';
import type {
  ApiSuccess,
  DomainSummary,
  DomainsPayload,
  PaginatedRefs,
  ReferenceRow,
} from './types';

export type ListDomainRefsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: string;
};

export async function listReferenceDomains(): Promise<DomainSummary[]> {
  const res = await apiRequest<ApiSuccess<DomainsPayload>>('GET', '/admin/references');
  return res.data.domains;
}

export async function listDomainReferences(
  domain: string,
  params: ListDomainRefsParams = {},
): Promise<PaginatedRefs> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.is_active !== undefined && params.is_active !== '') {
    qs.set('is_active', params.is_active);
  }
  const query = qs.toString();
  const res = await apiRequest<ApiSuccess<PaginatedRefs>>(
    'GET',
    `/admin/references/${encodeURIComponent(domain)}${query ? `?${query}` : ''}`,
  );
  return res.data;
}

export async function getDomainReference(
  domain: string,
  id: number | string,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'GET',
    `/admin/references/${encodeURIComponent(domain)}/${encodeURIComponent(String(id))}`,
  );
  return res.data;
}

export async function createDomainReference(
  domain: string,
  body: Record<string, unknown>,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'POST',
    `/admin/references/${encodeURIComponent(domain)}`,
    body,
  );
  return res.data;
}

export async function updateDomainReference(
  domain: string,
  id: number | string,
  body: Record<string, unknown>,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'PUT',
    `/admin/references/${encodeURIComponent(domain)}/${encodeURIComponent(String(id))}`,
    body,
  );
  return res.data;
}

export async function deleteDomainReference(
  domain: string,
  id: number | string,
): Promise<void> {
  await apiRequest<ApiSuccess<unknown>>(
    'DELETE',
    `/admin/references/${encodeURIComponent(domain)}/${encodeURIComponent(String(id))}`,
  );
}

export async function toggleDomainReferenceActive(
  domain: string,
  id: number | string,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'POST',
    `/admin/references/${encodeURIComponent(domain)}/${encodeURIComponent(String(id))}/toggle-active`,
  );
  return res.data;
}

export type ReferenceImportResult = {
  message: string;
  upserted: number;
  skipped: number;
};

export async function exportDomainReference(domain: string): Promise<void> {
  const headers = new Headers();
  const accessToken = tokenManager.getAccessToken();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/admin/references/${encodeURIComponent(domain)}/export`,
      { method: 'GET', headers },
    );
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw ApiClientError.fromNormalized(
      normalizeApiErrorPayload(payload, {
        status: response.status,
        statusText: response.statusText,
      }),
    );
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition') ?? '';
  const match = /filename=([^;]+)/i.exec(cd);
  const filename = match ? match[1].replace(/"/g, '').trim() : `${domain}-export.json`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function importDomainReference(
  domain: string,
  file: File,
): Promise<ReferenceImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiRequest<ApiSuccess<ReferenceImportResult> & { message?: string }>(
    'POST',
    `/admin/references/${encodeURIComponent(domain)}/import`,
    form,
  );
  return res.data;
}
