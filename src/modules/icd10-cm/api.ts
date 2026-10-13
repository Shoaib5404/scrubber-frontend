import { apiRequest } from '@/lib/api';

export type IcdCmItem = { code: string; description: string | null; is_billable?: boolean };

export type IcdCmChapterList = { items: IcdCmItem[] };

export type IcdCmNotes = {
  include_notes?: string[];
  notes?: string[];
  code_first_notes?: string[];
  additional_code_notes?: string[];
  exclude1_notes?: string[];
  exclude2_notes?: string[];
  inclusion_terms?: string[];
  code_also_notes?: string[];
  short_descriptions?: string[];
};

export type IcdCmChapter = IcdCmNotes & {
  chapter_code: string;
  chapter_description: string | null;
  sections: IcdCmItem[];
};

export type IcdCmSection = IcdCmNotes & {
  chapter_code: string;
  section_code: string;
  section_title: string;
  child_codes: IcdCmItem[];
  prev_section_code: string | null;
  next_section_code: string | null;
};

export type IcdCmCodeDetail = IcdCmNotes & {
  chapter_code: string;
  section_code: string;
  section_title?: string;
  parent_code?: string;
  code: string;
  is_billable: boolean;
  effective_start_date: string | null;
  main_description: string | null;
  clinical_bullets?: string[];
  description_groups: Array<{ type: number; type_label: string; lines: string[] }>;
  sub_codes: Array<IcdCmItem & { path: string }>;
  parent_nav: { code: string; path: string } | null;
};

export async function listIcdCmChapters(): Promise<IcdCmChapterList> {
  return apiRequest<IcdCmChapterList>('GET', '/icd10-cm/chapters');
}

export async function getIcdCmChapter(chapterCode: string): Promise<IcdCmChapter> {
  return apiRequest<IcdCmChapter>(
    'GET',
    `/icd10-cm/chapters/${encodeURIComponent(chapterCode)}`,
  );
}

export async function getIcdCmSection(
  chapterCode: string,
  sectionCode: string,
): Promise<IcdCmSection> {
  return apiRequest<IcdCmSection>(
    'GET',
    `/icd10-cm/chapters/${encodeURIComponent(chapterCode)}/sections/${encodeURIComponent(sectionCode)}`,
  );
}

export async function getIcdCmCode(
  chapterCode: string,
  sectionCode: string,
  code: string,
): Promise<IcdCmCodeDetail> {
  return apiRequest<IcdCmCodeDetail>(
    'GET',
    `/icd10-cm/chapters/${encodeURIComponent(chapterCode)}/sections/${encodeURIComponent(sectionCode)}/codes/${encodeURIComponent(code)}`,
  );
}

export async function getIcdCmChildCode(
  chapterCode: string,
  sectionCode: string,
  code: string,
  childCode: string,
): Promise<IcdCmCodeDetail> {
  return apiRequest<IcdCmCodeDetail>(
    'GET',
    `/icd10-cm/chapters/${encodeURIComponent(chapterCode)}/sections/${encodeURIComponent(sectionCode)}/codes/${encodeURIComponent(code)}/children/${encodeURIComponent(childCode)}`,
  );
}
