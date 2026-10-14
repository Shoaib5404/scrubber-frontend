import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <main className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your account email and we will send a password reset link.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
