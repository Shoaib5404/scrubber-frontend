import { apiRequest } from '@/lib/api';

export type ArticleShowPayload = {
  article: Record<string, unknown>;
  requested_article_version: number | null;
  article_contractor_rows: Array<Record<string, unknown>>;
  article_coding: {
    hcpcs?: Record<string, unknown>;
    hcpc_modifiers?: Record<string, unknown>;
    icd10_cm_covered?: Array<Record<string, unknown>>;
    icd10_cm_noncovered?: Array<Record<string, unknown>>;
    icd10_pcs?: Array<Record<string, unknown>>;
    bill_codes?: Array<Record<string, unknown>>;
    revenue_codes?: Array<Record<string, unknown>>;
    other_coding?: Array<Record<string, unknown>>;
    add_icd10_info?: string | null;
  };
  article_related_documents: Array<Record<string, unknown>>;
  article_related_ncd_documents: Array<Record<string, unknown>>;
  article_associated_urls: Record<string, Array<Record<string, unknown>>>;
  article_public_versions: Array<Record<string, unknown>>;
  article_sticky_notes: Array<Record<string, unknown>>;
  article_response_to_comments: Array<Record<string, unknown>>;
  associated_document_url_headings: Record<string, string>;
};

export async function getArticleShow(
  articleId: number,
  ver?: number | null,
): Promise<ArticleShowPayload> {
  const qs = ver != null && ver > 0 ? `?ver=${ver}` : '';
  const res = await apiRequest<{ success: boolean; data: ArticleShowPayload }>(
    'GET',
    `/admin/references/articles/by-number/${articleId}${qs}`,
  );
  return res.data;
}
