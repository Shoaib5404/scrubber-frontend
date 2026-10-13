'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AsyncState, friendlyError } from '@/modules/batches/components/async-state';
import {
  getIcdCmChapter,
  getIcdCmChildCode,
  getIcdCmCode,
  getIcdCmSection,
  listIcdCmChapters,
  type IcdCmChapter,
  type IcdCmChapterList,
  type IcdCmCodeDetail,
  type IcdCmSection,
} from '../api';
import { Icd10CmNotes } from './icd10-cm-notes';

type Level =
  | { kind: 'chapters' }
  | { kind: 'chapter'; chapter: string }
  | { kind: 'section'; chapter: string; section: string }
  | { kind: 'code'; chapter: string; section: string; code: string }
  | { kind: 'child'; chapter: string; section: string; code: string; child: string };

export function Icd10CmBrowser({ level }: { level: Level }) {
  const [data, setData] = useState<
    IcdCmChapterList | IcdCmChapter | IcdCmSection | IcdCmCodeDetail | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const levelKey = JSON.stringify(level);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(levelKey) as Level;
      switch (parsed.kind) {
        case 'chapters':
          setData(await listIcdCmChapters());
          break;
        case 'chapter':
          setData(await getIcdCmChapter(parsed.chapter));
          break;
        case 'section':
          setData(await getIcdCmSection(parsed.chapter, parsed.section));
          break;
        case 'code':
          setData(await getIcdCmCode(parsed.chapter, parsed.section, parsed.code));
          break;
        case 'child':
          setData(
            await getIcdCmChildCode(
              parsed.chapter,
              parsed.section,
              parsed.code,
              parsed.child,
            ),
          );
          break;
        default: {
          const _exhaustive: never = parsed;
          void _exhaustive;
          setData(null);
        }
      }
    } catch (err) {
      setError(friendlyError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [levelKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <Breadcrumbs level={level} />
      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {data ? <LevelBody level={level} data={data} /> : null}
      </AsyncState>
    </div>
  );
}

function Breadcrumbs({ level }: { level: Level }) {
  const crumbs: Array<{ href: string; label: string }> = [
    { href: '/icd10-cm', label: 'ICD-10-CM' },
  ];
  if (level.kind !== 'chapters') {
    crumbs.push({
      href: `/icd10-cm/${encodeURIComponent(level.chapter)}`,
      label: level.chapter,
    });
  }
  if (level.kind === 'section' || level.kind === 'code' || level.kind === 'child') {
    crumbs.push({
      href: `/icd10-cm/${encodeURIComponent(level.chapter)}/${encodeURIComponent(level.section)}`,
      label: level.section,
    });
  }
  if (level.kind === 'code' || level.kind === 'child') {
    crumbs.push({
      href: `/icd10-cm/${encodeURIComponent(level.chapter)}/${encodeURIComponent(level.section)}/${encodeURIComponent(level.code)}`,
      label: level.code,
    });
  }
  if (level.kind === 'child') {
    crumbs.push({
      href: `/icd10-cm/${encodeURIComponent(level.chapter)}/${encodeURIComponent(level.section)}/${encodeURIComponent(level.code)}/${encodeURIComponent(level.child)}`,
      label: level.child,
    });
  }

  return (
    <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-slate-900">{c.label}</span>
            ) : (
              <Link href={c.href} className="underline-offset-2 hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function LevelBody({
  level,
  data,
}: {
  level: Level;
  data: IcdCmChapterList | IcdCmChapter | IcdCmSection | IcdCmCodeDetail;
}) {
  if (level.kind === 'chapters' && 'items' in data) {
    return (
      <>
        <h2 className="text-xl font-semibold text-slate-900">ICD-10-CM Chapters</h2>
        <p className="mt-1 text-sm text-slate-600">Browse chapters, sections, and codes.</p>
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {data.items.map((item) => (
            <li key={item.code}>
              <Link
                href={`/icd10-cm/${encodeURIComponent(item.code)}`}
                className="flex gap-3 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="w-24 shrink-0 font-mono font-medium text-slate-900">
                  {item.code}
                </span>
                <span className="text-slate-700">{item.description ?? '—'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (level.kind === 'chapter' && 'sections' in data) {
    const chapter = data as IcdCmChapter;
    return (
      <>
        <h2 className="text-xl font-semibold text-slate-900">
          Chapter {chapter.chapter_code}
        </h2>
        {chapter.chapter_description ? (
          <p className="mt-2 text-sm text-slate-700">{chapter.chapter_description}</p>
        ) : null}
        <Icd10CmNotes notes={chapter} />
        <h3 className="mt-6 text-base font-semibold text-slate-900">Sections</h3>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {chapter.sections.map((item) => (
            <li key={item.code}>
              <Link
                href={`/icd10-cm/${encodeURIComponent(chapter.chapter_code)}/${encodeURIComponent(item.code)}`}
                className="flex gap-3 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="w-28 shrink-0 font-mono font-medium">{item.code}</span>
                <span className="text-slate-700">{item.description ?? '—'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (level.kind === 'section' && 'child_codes' in data) {
    const section = data as IcdCmSection;
    return (
      <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{section.section_code}</h2>
            <p className="mt-1 text-sm text-slate-700">{section.section_title}</p>
          </div>
          <div className="flex gap-2 text-sm">
            {section.prev_section_code ? (
              <Link
                href={`/icd10-cm/${encodeURIComponent(section.chapter_code)}/${encodeURIComponent(section.prev_section_code)}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                ← Prev
              </Link>
            ) : null}
            {section.next_section_code ? (
              <Link
                href={`/icd10-cm/${encodeURIComponent(section.chapter_code)}/${encodeURIComponent(section.next_section_code)}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>
        <Icd10CmNotes notes={section} />
        <h3 className="mt-6 text-base font-semibold text-slate-900">Codes</h3>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {section.child_codes.map((item) => (
            <li key={item.code}>
              <Link
                href={`/icd10-cm/${encodeURIComponent(section.chapter_code)}/${encodeURIComponent(section.section_code)}/${encodeURIComponent(item.code)}`}
                className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="w-28 shrink-0 font-mono font-medium">{item.code}</span>
                <span className="flex-1 text-slate-700">{item.description ?? '—'}</span>
                {item.is_billable ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                    Billable
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const detail = data as IcdCmCodeDetail;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {detail.code}
            {detail.is_billable ? (
              <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Billable
              </span>
            ) : null}
          </h2>
          {detail.main_description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {detail.main_description}
            </p>
          ) : null}
          {detail.effective_start_date ? (
            <p className="mt-1 text-xs text-slate-500">
              Effective {detail.effective_start_date}
            </p>
          ) : null}
        </div>
        {detail.parent_nav ? (
          <Link
            href={detail.parent_nav.path}
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            ↑ Parent {detail.parent_nav.code}
          </Link>
        ) : null}
      </div>

      {(detail.clinical_bullets ?? []).length > 0 ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Clinical / inclusion</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {detail.clinical_bullets!.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Icd10CmNotes notes={detail} />

      {detail.description_groups?.length ? (
        <div className="mt-4 space-y-3">
          {detail.description_groups.map((g) => (
            <div key={g.type} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {g.type_label}
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {g.lines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {detail.sub_codes.length > 0 ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-slate-900">Child codes</h3>
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {detail.sub_codes.map((item) => (
              <li key={item.code}>
                <Link
                  href={item.path}
                  className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <span className="w-28 shrink-0 font-mono font-medium">{item.code}</span>
                  <span className="flex-1 text-slate-700">{item.description ?? '—'}</span>
                  {item.is_billable ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      Billable
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
