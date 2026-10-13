'use client';

import Link from 'next/link';
import { FormEvent, useId, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import { acceptInviteRequest } from '../api';

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const errorId = useId();

  const initialEmail = useMemo(() => searchParams.get('email') ?? '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Invite token is missing. Ask your administrator to resend the invite.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      await acceptInviteRequest({
        email: email.trim(),
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace('/login?invited=1');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to accept invite. Please try again.',
      );
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
        />
      </div>
      <div>
        <label htmlFor={passwordId} className="block text-sm font-medium text-slate-800">
          Password
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label htmlFor={confirmId} className="block text-sm font-medium text-slate-800">
          Confirm password
        </label>
        <input
          id={confirmId}
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? 'Accepting…' : 'Accept invite'}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-slate-900 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
