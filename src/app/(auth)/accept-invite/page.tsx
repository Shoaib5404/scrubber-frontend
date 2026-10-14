import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteForm, AuthPanel } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Accept invite',
};

export default function AcceptInvitePage() {
  return (
    <AuthPanel
      title="Accept invite"
      description="Set a password to join your organization on Neo Scrubber."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </AuthPanel>
  );
}
