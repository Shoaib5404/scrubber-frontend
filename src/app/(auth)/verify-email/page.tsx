import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailPanel } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Verify email',
};

export default function VerifyEmailPage() {
  return (
    <main className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Verify email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Confirm your email address to finish setting up your Neo Scrubber account.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <VerifyEmailPanel />
        </Suspense>
      </div>
    </main>
  );
}
