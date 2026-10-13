'use client';

import Link from 'next/link';
import { FormEvent, useId, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import { forgotPasswordRequest } from '../api';

export function ForgotPasswordForm() {
  const emailId = useId();
  const errorId = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await forgotPasswordRequest(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to send reset link. Please try again.',
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Email password reset link'}
      </button>

      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-slate-900 underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
