import { Suspense } from 'react';
import { ResetPasswordForm } from '@/modules/auth';

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Choose a new password for your Neo Scrubber account.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-slate-600">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}