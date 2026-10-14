import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ConfirmPasswordForm, RequireAuth } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Confirm password',
};

export default function ConfirmPasswordPage() {
  return (
    <RequireAuth allowUnverified>
      <main className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Confirm password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a secure area of the application. Please confirm your password before
          continuing.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ConfirmPasswordForm />
          </Suspense>
        </div>
      </main>
    </RequireAuth>
  );
}
