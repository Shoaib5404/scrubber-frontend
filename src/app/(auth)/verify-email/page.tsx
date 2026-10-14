import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPanel, VerifyEmailPanel } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Verify email',
};

export default function VerifyEmailPage() {
  return (
    <AuthPanel
      title="Verify email"
      description="Confirm your email address to finish setting up your Neo Scrubber account."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <VerifyEmailPanel />
      </Suspense>
    </AuthPanel>
  );
}
