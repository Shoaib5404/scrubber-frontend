'use client';

import Link from 'next/link';
import { FormEvent, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import { useAuthStore } from '../store/auth-store';
import { ACCOUNT_DEACTIVATED_MESSAGE } from '../types';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    searchParams.get('reason') === 'deactivated' ? ACCOUNT_DEACTIVATED_MESSAGE : null,
  );
  const [loading, setLoading] = useState(false);
  const resetNotice = searchParams.get('reset') === '1';
  const deactivatedNotice = searchParams.get('reason') === 'deactivated';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const next = await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to sign in. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={passwordId} className="block text-sm font-medium text-slate-800">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {resetNotice ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Your password has been reset. You can sign in with your new password.
        </p>
      ) : null}

      {deactivatedNotice && !error ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          data-testid="account-deactivated-notice"
        >
          {ACCOUNT_DEACTIVATED_MESSAGE}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          data-testid="login-error"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
