import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPasswordPage() {
  return (
    <main className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Reset password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a new password for your Neo Scrubber account.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}