'use client';

import { AppShell } from '@/modules/batches/components/app-shell';
import { IntegrationsPanel } from '@/modules/integrations';

export default function IntegrationsPage() {
  return (
    <AppShell title="Integrations" basePath="/portal">
      <IntegrationsPanel />
    </AppShell>
  );
}
