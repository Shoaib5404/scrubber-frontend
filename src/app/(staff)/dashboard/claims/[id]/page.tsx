'use client';

import { use } from 'react';
import { AppShell, ClaimDetail } from '@/modules/batches';

export default function StaffClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const claimId = Number(id);

  return (
    <AppShell title="Claim detail" basePath="/dashboard">
      <ClaimDetail claimId={claimId} basePath="/dashboard" />
    </AppShell>
  );
}
