'use client';

import { AppShell } from '@/modules/batches';
import { Icd10CmBrowser } from '@/modules/icd10-cm/components/icd10-cm-browser';

export default function Icd10CmIndexPage() {
  return (
    <AppShell title="ICD-10-CM" basePath="/dashboard">
      <Icd10CmBrowser level={{ kind: 'chapters' }} />
    </AppShell>
  );
}
