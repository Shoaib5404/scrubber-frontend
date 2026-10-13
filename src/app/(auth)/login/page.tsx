import { Suspense } from 'react';
import { LoginForm } from '@/modules/auth';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use your Neo Scrubber account email and password.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-slate-600">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
