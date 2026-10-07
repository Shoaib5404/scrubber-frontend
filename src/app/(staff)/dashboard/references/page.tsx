'use client';

import { AppShell } from '@/modules/batches';
import { DomainList } from '@/modules/reference-admin';

export default function ReferenceDomainsPage() {
  return (
    <AppShell title="Reference data" basePath="/dashboard">
      <DomainList />
    </AppShell>
  );
}
