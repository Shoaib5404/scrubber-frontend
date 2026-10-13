'use client';

import Link from 'next/link';
import { FormEvent, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import { tokenManager } from '@/lib/auth/token-manager';
import { confirmPasswordRequest } from '../api';
import { useAuthStore } from '../store/auth-store';
import { homePathForRole } from '../types';

export function ConfirmPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordId = useId();
  const errorId = useId();
  const user = useAuthStore((s) => s.user);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await confirmPasswordRequest(password);
      tokenManager.setPasswordConfirmedToken(result.password_confirmed_token);
      const redirect =
        searchParams.get('redirect') ||
        (user ? homePathForRole(user.role) : '/login');
      router.replace(redirect);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to confirm password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor={passwordId} className="block text-sm font-medium text-slate-800">
          Password
        </label>
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

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Confirming…' : 'Confirm'}
      </button>

      <p className="text-center text-sm text-slate-600">
        <Link
          href={user ? homePathForRole(user.role) : '/login'}
          className="font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          Cancel
        </Link>
      </p>
    </form>
  );
}
