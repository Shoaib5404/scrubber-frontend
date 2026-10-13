'use client';

import { use } from 'react';
import { AppShell } from '@/modules/batches';
import { Icd10CmBrowser } from '@/modules/icd10-cm/components/icd10-cm-browser';

export default function Icd10CmChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = use(params);
  return (
    <AppShell title="ICD-10-CM" basePath="/dashboard">
      <Icd10CmBrowser
        level={{ kind: 'chapter', chapter: decodeURIComponent(chapter) }}
      />
    </AppShell>
  );
}
