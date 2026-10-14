import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPanel, ConfirmPasswordForm, RequireAuth } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Confirm password',
};

export default function ConfirmPasswordPage() {
  return (
    <RequireAuth allowUnverified>
      <AuthPanel
        title="Confirm password"
        description="This is a secure area of the application. Please confirm your password before continuing."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ConfirmPasswordForm />
        </Suspense>
      </AuthPanel>
    </RequireAuth>
  );
}
