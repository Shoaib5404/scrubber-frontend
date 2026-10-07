'use client';

import { AppShell } from '@/modules/batches';
import { CodingSearchPanel } from '@/modules/coding-reference/components/coding-search-panel';

export default function SearchPage() {
  return (
    <AppShell title="Coding reference" basePath="/dashboard">
      <CodingSearchPanel />
    </AppShell>
  );
}
