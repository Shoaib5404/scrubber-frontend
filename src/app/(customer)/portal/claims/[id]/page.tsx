'use client';

import { use } from 'react';
import { AppShell, ClaimDetail } from '@/modules/batches';

export default function CustomerClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const claimId = Number(id);

  return (
    <AppShell title="Claim detail" basePath="/portal">
      <ClaimDetail claimId={claimId} basePath="/portal" />
    </AppShell>
  );
}
