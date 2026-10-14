import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPanel, ResetPasswordForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPasswordPage() {
  return (
    <AuthPanel
      title="Reset password"
      description="Choose a new password for your Neo Scrubber account."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPanel>
  );
}
