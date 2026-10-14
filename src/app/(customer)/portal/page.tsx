'use client';

import { AppShell } from '@/modules/batches';
import { CustomerDashboard } from '@/modules/dashboard';

export default function CustomerHomePage() {
  return (
    <AppShell
      title="Dashboard"
      description="Overview of your organization's batches, claims, and team activity."
      basePath="/portal"
    >
      <CustomerDashboard />
    </AppShell>
  );
}
