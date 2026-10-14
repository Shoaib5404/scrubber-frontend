import type { Metadata } from 'next';
import { AuthPanel, ForgotPasswordForm } from '@/modules/auth';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Forgot password"
      description="Enter your account email and we will send a password reset link."
    >
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
