import { apiRequest } from '@/lib/api';

type ApiSuccess<T> = { success: boolean; data: T };

export type InquiryAttachmentMeta = {
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string | null;
};

export type InquiryTicket = {
  id: number;
  public_reference: string;
  source: string;
  tenant_id: number | null;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
  requester_organization: string | null;
  category: string;
  category_label: string;
  subject: string;
  description: string;
  related_batch_id: number | null;
  status: string;
  priority: string;
  email_notify_status: string | null;
  has_attachment: boolean;
  attachment: InquiryAttachmentMeta | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InquiryMessage = {
  id: number;
  author_type: string;
  body: string;
  created_at: string;
  author: { id: number; name: string; email: string | null } | null;
};

export type InquiryDetail = InquiryTicket & {
  messages: InquiryMessage[];
};

export type InquiriesPage = {
  data: InquiryTicket[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
};

export const PUBLIC_CATEGORIES = [
  { value: 'sales_demo', label: 'Sales / Demo Request' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'onboarding', label: 'Onboarding / Getting Started' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'other', label: 'Other' },
] as const;

export const PORTAL_CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'claim_validation', label: 'Claim Validation Question' },
  { value: 'batch_processing', label: 'Batch Processing Issue' },
  { value: 'account_access', label: 'Account / Access Issue' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
] as const;

export const INQUIRY_STATUSES = [
  'open',
  'in_progress',
  'waiting_for_customer',
  'resolved',
  'closed',
] as const;

export const INQUIRY_ACCEPT =
  '.edi,.x12,.txt,.png,.jpg,.jpeg,application/EDI-X12,text/plain,image/png,image/jpeg';

export const INQUIRY_MAX_BYTES = 5_242_880;

export async function createPublicInquiry(input: {
  name: string;
  email: string;
  organization?: string;
  category: string;
  subject: string;
  message: string;
}): Promise<InquiryTicket> {
  const res = await apiRequest<ApiSuccess<InquiryTicket>>(
    'POST',
    '/support/public',
    input,
    { skipAuth: true },
  );
  return res.data;
}

export async function createPortalInquiry(input: {
  category: string;
  subject: string;
  message: string;
  related_batch_id?: number;
  attachment_object_key?: string;
  attachment_original_name?: string;
  attachment_mime_type?: string;
  attachment_size_bytes?: number;
}): Promise<InquiryTicket> {
  const res = await apiRequest<ApiSuccess<InquiryTicket>>(
    'POST',
    '/support',
    input,
  );
  return res.data;
}

export async function presignInquiryAttachment(input: {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{
  url: string;
  objectKey: string;
  expiresIn: number;
  headers: Record<string, string>;
  originalFilename: string;
  mimeType: string;
  maxSizeBytes: number;
}> {
  const res = await apiRequest<
    ApiSuccess<{
      url: string;
      objectKey: string;
      expiresIn: number;
      headers: Record<string, string>;
      originalFilename: string;
      mimeType: string;
      maxSizeBytes: number;
    }>
  >('POST', '/support/attachments/presign', input);
  return res.data;
}

export async function putInquiryAttachment(
  url: string,
  file: File,
  headers: Record<string, string>,
): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Attachment upload failed (${response.status}).`);
  }
}

export async function listMyInquiries(params: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<InquiriesPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  const res = await apiRequest<ApiSuccess<InquiriesPage>>(
    'GET',
    `/support/mine?${qs.toString()}`,
  );
  return res.data;
}

export async function getMyInquiry(id: number): Promise<InquiryDetail> {
  const res = await apiRequest<ApiSuccess<InquiryDetail>>(
    'GET',
    `/support/mine/${id}`,
  );
  return res.data;
}

export async function replyToMyInquiry(
  id: number,
  body: string,
): Promise<InquiryMessage> {
  const res = await apiRequest<ApiSuccess<InquiryMessage>>(
    'POST',
    `/support/mine/${id}/replies`,
    { body },
  );
  return res.data;
}

export async function listAdminInquiries(params: {
  page?: number;
  per_page?: number;
  status?: string;
  category?: string;
  q?: string;
}): Promise<InquiriesPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  const res = await apiRequest<ApiSuccess<InquiriesPage>>(
    'GET',
    `/admin/inquiries?${qs.toString()}`,
  );
  return res.data;
}

export async function getAdminInquiry(id: number): Promise<InquiryDetail> {
  const res = await apiRequest<ApiSuccess<InquiryDetail>>(
    'GET',
    `/admin/inquiries/${id}`,
  );
  return res.data;
}

export async function patchInquiryStatus(
  id: number,
  status: string,
): Promise<InquiryTicket> {
  const res = await apiRequest<ApiSuccess<InquiryTicket>>(
    'PATCH',
    `/admin/inquiries/${id}`,
    { status },
  );
  return res.data;
}

export async function replyToInquiry(
  id: number,
  body: string,
): Promise<InquiryMessage> {
  const res = await apiRequest<ApiSuccess<InquiryMessage>>(
    'POST',
    `/admin/inquiries/${id}/replies`,
    { body },
  );
  return res.data;
}

export async function getInquiryAttachmentUrl(id: number): Promise<{
  url: string;
  expires_in: number;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
}> {
  const res = await apiRequest<
    ApiSuccess<{
      url: string;
      expires_in: number;
      original_name: string | null;
      mime_type: string | null;
      size_bytes: number | null;
    }>
  >('GET', `/admin/inquiries/${id}/attachment`);
  return res.data;
}

export function mimeForInquiryFile(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.txt')) return 'text/plain';
  if (name.endsWith('.edi') || name.endsWith('.x12')) return 'application/EDI-X12';
  return 'application/octet-stream';
}
