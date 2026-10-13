import { Suspense } from 'react';
import { ConfirmPasswordForm, RequireAuth } from '@/modules/auth';

export default function ConfirmPasswordPage() {
  return (
    <RequireAuth allowUnverified>
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Confirm password</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is a secure area of the application. Please confirm your password before
          continuing.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-slate-600">Loading…</p>}>
          <ConfirmPasswordForm />
        </Suspense>
      </main>
    </RequireAuth>
  );
}
