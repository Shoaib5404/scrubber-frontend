import { Suspense } from 'react';
import { AcceptInviteForm } from '@/modules/auth';

export default function AcceptInvitePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Accept invite</h1>
      <p className="mt-2 text-sm text-slate-600">
        Set a password to join your organization on Neo Scrubber.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-slate-600">Loading…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </main>
  );
}
