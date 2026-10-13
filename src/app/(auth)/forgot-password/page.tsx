import { ForgotPasswordForm } from '@/modules/auth';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your account email and we will send a password reset link.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
