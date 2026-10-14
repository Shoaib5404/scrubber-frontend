'use client';

import { AppShell } from '@/modules/batches';
import { StaffDashboard } from '@/modules/dashboard';

export default function StaffHomePage() {
  return (
    <AppShell
      title="Dashboard"
      description="Platform overview for tenants, batch processing health, and recent activity."
      basePath="/dashboard"
    >
      <StaffDashboard />
    </AppShell>
  );
}
