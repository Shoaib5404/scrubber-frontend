import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Accept invite',
};

export default function AcceptInvitePage() {
  return (
    <main className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Accept invite</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Set a password to join your organization on Neo Scrubber.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </main>
  );
}
