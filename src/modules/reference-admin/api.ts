import { apiRequest } from '@/lib/api';
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
  id: number,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'GET',
    `/admin/references/${encodeURIComponent(domain)}/${id}`,
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
  id: number,
  body: Record<string, unknown>,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'PUT',
    `/admin/references/${encodeURIComponent(domain)}/${id}`,
    body,
  );
  return res.data;
}

export async function deleteDomainReference(domain: string, id: number): Promise<void> {
  await apiRequest<ApiSuccess<unknown>>(
    'DELETE',
    `/admin/references/${encodeURIComponent(domain)}/${id}`,
  );
}

export async function toggleDomainReferenceActive(
  domain: string,
  id: number,
): Promise<ReferenceRow> {
  const res = await apiRequest<ApiSuccess<ReferenceRow>>(
    'POST',
    `/admin/references/${encodeURIComponent(domain)}/${id}/toggle-active`,
  );
  return res.data;
}
