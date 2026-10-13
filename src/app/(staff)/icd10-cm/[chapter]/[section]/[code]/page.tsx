'use client';

import { use } from 'react';
import { AppShell } from '@/modules/batches';
import { Icd10CmBrowser } from '@/modules/icd10-cm/components/icd10-cm-browser';

export default function Icd10CmCodePage({
  params,
}: {
  params: Promise<{ chapter: string; section: string; code: string }>;
}) {
  const { chapter, section, code } = use(params);
  return (
    <AppShell title="ICD-10-CM" basePath="/dashboard">
      <Icd10CmBrowser
        level={{
          kind: 'code',
          chapter: decodeURIComponent(chapter),
          section: decodeURIComponent(section),
          code: decodeURIComponent(code),
        }}
      />
    </AppShell>
  );
}
