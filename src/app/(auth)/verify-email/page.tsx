import { Suspense } from 'react';
import { VerifyEmailPanel } from '@/modules/auth';

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Verify email</h1>
      <p className="mt-2 text-sm text-slate-600">
        Confirm your email address to finish setting up your Neo Scrubber account.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-slate-600">Loading…</p>}>
        <VerifyEmailPanel />
      </Suspense>
    </main>
  );
}
