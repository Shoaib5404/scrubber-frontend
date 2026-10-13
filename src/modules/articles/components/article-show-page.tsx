'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
import { getArticleShow, type ArticleShowPayload } from '../api';

type SectionKey =
  | 'contractors'
  | 'articleInfo'
  | 'responseToComments'
  | 'coding'
  | 'associatedDocs'
  | 'keywords'
  | 'versions';

function str(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
  empty,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  empty?: boolean;
}) {
  if (empty) return null;
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm" data-section={id}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="text-slate-400" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

function KeyValueGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function CodingGroupList({
  title,
  groups,
}: {
  title: string;
  groups: Array<Record<string, unknown>> | undefined;
}) {
  if (!groups || groups.length === 0) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {groups.map((g, idx) => {
        const codes = Array.isArray(g.codes) ? (g.codes as Array<Record<string, unknown>>) : [];
        const groupLabel = str(g.group ?? g.code_group ?? idx + 1);
        return (
          <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Group {groupLabel}</p>
            {codes.length === 0 ? (
              <p className="mt-1 text-sm text-slate-600">No codes</p>
            ) : (
              <ul className="mt-2 grid gap-1 font-mono text-sm text-slate-800 sm:grid-cols-2 md:grid-cols-3">
                {codes.map((c, i) => (
                  <li key={i}>{str(c.hcpc_code_id ?? c.icd10_code_id ?? c.code ?? c.icd10_code)}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ArticleShowPage({
  articleId,
  ver,
}: {
  articleId: number;
  ver?: number | null;
}) {
  const [data, setData] = useState<ArticleShowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    contractors: true,
    articleInfo: true,
    responseToComments: false,
    coding: true,
    associatedDocs: false,
    keywords: false,
    versions: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getArticleShow(articleId, ver));
    } catch (err) {
      setError(friendlyError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [articleId, ver]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (key: SectionKey) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const expandAll = () =>
    setOpen({
      contractors: true,
      articleInfo: true,
      responseToComments: true,
      coding: true,
      associatedDocs: true,
      keywords: true,
      versions: true,
    });

  const collapseAll = () =>
    setOpen({
      contractors: false,
      articleInfo: false,
      responseToComments: false,
      coding: false,
      associatedDocs: false,
      keywords: false,
      versions: false,
    });

  const article = data?.article;
  const coding = data?.article_coding;
  const hasRtc = (data?.article_response_to_comments?.length ?? 0) > 0;
  const hasKeywords = Boolean(str(article?.keywords).trim());
  const hasAssociated =
    (data?.article_related_documents?.length ?? 0) > 0 ||
    (data?.article_related_ncd_documents?.length ?? 0) > 0 ||
    Object.values(data?.article_associated_urls ?? {}).some((a) => a.length > 0);

  const hcpcsGroups = useMemo(() => {
    const raw = coding?.hcpcs;
    if (!raw || typeof raw !== 'object') return [] as Array<Record<string, unknown>>;
    return Object.values(raw as Record<string, Record<string, unknown>>);
  }, [coding?.hcpcs]);

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link
          href="/dashboard/references/articles"
          className="text-slate-600 underline-offset-2 hover:underline"
        >
          ← Articles
        </Link>
      </p>

      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {article ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Article {str(article.article_id)}
                  {article.article_version != null
                    ? ` · v${str(article.article_version)}`
                    : ''}
                </h2>
                <p className="mt-1 text-sm text-slate-700">{str(article.title) || 'Untitled'}</p>
                {str(article.status) ? (
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {str(article.status)}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Collapse all
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <AccordionSection
                id="contractors"
                title="Contractors"
                open={open.contractors}
                onToggle={() => toggle('contractors')}
              >
                {(data?.article_contractor_rows?.length ?? 0) === 0 ? (
                  <p className="text-sm text-slate-600">No contractors listed.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data!.article_contractor_rows.map((row, idx) => {
                      const contractor =
                        row.contractor && typeof row.contractor === 'object'
                          ? (row.contractor as Record<string, unknown>)
                          : null;
                      const name =
                        contractor?.contractor_name ??
                        contractor?.name ??
                        row.contractor_name ??
                        row.name ??
                        contractor?.contractor_id ??
                        row.contractor_id;
                      return (
                        <li key={idx} className="py-2">
                          <span className="font-medium text-slate-900">{str(name)}</span>
                          {row.jurisdiction_states ? (
                            <span className="ml-2 text-slate-600">
                              ({str(row.jurisdiction_states)})
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </AccordionSection>

              <AccordionSection
                id="articleInfo"
                title="Article information"
                open={open.articleInfo}
                onToggle={() => toggle('articleInfo')}
              >
                <KeyValueGrid
                  rows={[
                    ['Type', str(article.article_type_description ?? article.article_type)],
                    ['Display ID', str(article.display_id)],
                    ['Pub date', str(article.article_pub_date).slice(0, 10)],
                    ['Eff date', str(article.article_eff_date).slice(0, 10)],
                    ['End date', str(article.article_end_date).slice(0, 10)],
                    ['Last updated', str(article.last_updated).slice(0, 10)],
                    ['Description', str(article.description)],
                    ['Other comments', str(article.other_comments)],
                    ['CMS coverage policy', str(article.cms_cov_policy)],
                  ]}
                />
              </AccordionSection>

              <AccordionSection
                id="responseToComments"
                title="Response to comments"
                open={open.responseToComments}
                onToggle={() => toggle('responseToComments')}
                empty={!hasRtc}
              >
                <ul className="space-y-2 text-sm text-slate-700">
                  {data!.article_response_to_comments.map((row, idx) => (
                    <li key={idx} className="rounded border border-slate-200 bg-slate-50 p-3">
                      {str(row.response ?? row.comment ?? JSON.stringify(row))}
                    </li>
                  ))}
                </ul>
              </AccordionSection>

              <AccordionSection
                id="coding"
                title="Coding information"
                open={open.coding}
                onToggle={() => toggle('coding')}
              >
                <div className="space-y-6">
                  <CodingGroupList title="HCPCS" groups={hcpcsGroups} />
                  <CodingGroupList
                    title="ICD-10-CM Covered"
                    groups={coding?.icd10_cm_covered}
                  />
                  <CodingGroupList
                    title="ICD-10-CM Noncovered"
                    groups={coding?.icd10_cm_noncovered}
                  />
                  <CodingGroupList title="ICD-10-PCS" groups={coding?.icd10_pcs} />
                  {(coding?.bill_codes?.length ?? 0) > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Bill codes</h4>
                      <ul className="mt-2 grid gap-1 font-mono text-sm sm:grid-cols-2 md:grid-cols-3">
                        {coding!.bill_codes!.map((c, i) => (
                          <li key={i}>
                            {str(c.bill_code_id)}
                            {c.description ? (
                              <span className="font-sans text-slate-600"> — {str(c.description)}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(coding?.revenue_codes?.length ?? 0) > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Revenue codes</h4>
                      <ul className="mt-2 grid gap-1 font-mono text-sm sm:grid-cols-2 md:grid-cols-3">
                        {coding!.revenue_codes!.map((c, i) => (
                          <li key={i}>
                            {str(c.revenue_code_id)}
                            {c.description ? (
                              <span className="font-sans text-slate-600"> — {str(c.description)}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {coding?.add_icd10_info ? (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Additional ICD-10 info</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {str(coding.add_icd10_info)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </AccordionSection>

              <AccordionSection
                id="associatedDocs"
                title="Associated documents"
                open={open.associatedDocs}
                onToggle={() => toggle('associatedDocs')}
                empty={!hasAssociated}
              >
                <div className="space-y-4 text-sm">
                  {(data?.article_related_documents?.length ?? 0) > 0 ? (
                    <div>
                      <h4 className="font-semibold text-slate-800">Related LCD / articles</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {data!.article_related_documents.map((doc, idx) => (
                          <li key={idx}>
                            {str(doc.title ?? doc.related_id ?? doc.lcd_id)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(data?.article_related_ncd_documents?.length ?? 0) > 0 ? (
                    <div>
                      <h4 className="font-semibold text-slate-800">Related NCD</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {data!.article_related_ncd_documents.map((doc, idx) => (
                          <li key={idx}>{str(doc.title ?? doc.ncd_id)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Object.entries(data?.article_associated_urls ?? {}).map(([type, urls]) =>
                    urls.length ? (
                      <div key={type}>
                        <h4 className="font-semibold text-slate-800">
                          {data!.associated_document_url_headings?.[type] ?? `URLs (${type})`}
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {urls.map((u, idx) => (
                            <li key={idx}>
                              {str(u.url) ? (
                                <a
                                  href={str(u.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-900 underline"
                                >
                                  {str(u.title ?? u.url)}
                                </a>
                              ) : (
                                str(u.title)
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              </AccordionSection>

              <AccordionSection
                id="keywords"
                title="Keywords"
                open={open.keywords}
                onToggle={() => toggle('keywords')}
                empty={!hasKeywords}
              >
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {str(article.keywords)}
                </p>
              </AccordionSection>

              <AccordionSection
                id="versions"
                title="Public versions"
                open={open.versions}
                onToggle={() => toggle('versions')}
                empty={(data?.article_public_versions?.length ?? 0) === 0}
              >
                <ul className="space-y-1 text-sm">
                  {data!.article_public_versions.map((v, idx) => {
                    const version = Number(v.article_version);
                    return (
                      <li key={idx}>
                        <Link
                          href={`/dashboard/articles/${articleId}${Number.isFinite(version) ? `?ver=${version}` : ''}`}
                          className="text-slate-900 underline-offset-2 hover:underline"
                        >
                          Version {str(v.article_version)}
                          {v.article_eff_date
                            ? ` · eff ${str(v.article_eff_date).slice(0, 10)}`
                            : ''}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionSection>
            </div>
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}
