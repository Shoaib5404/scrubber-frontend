'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import { sendVerificationRequest, verifyEmailRequest } from '../api';
import { useAuthStore } from '../store/auth-store';
import { homePathForRole } from '../types';

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const patchUser = useAuthStore((s) => s.patchUser);

  const link = useMemo(() => {
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');
    const expires = searchParams.get('expires');
    const signature = searchParams.get('signature');
    if (!id || !hash || !expires || !signature) {
      return null;
    }
    return {
      id: Number(id),
      hash,
      expires: Number(expires),
      signature,
    };
  }, [searchParams]);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(!!link);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!link) {
      return;
    }
    let cancelled = false;
    (async () => {
      setVerifying(true);
      setError(null);
      try {
        const result = await verifyEmailRequest(link);
        if (cancelled) {
          return;
        }
        setMessage(result.message);
        patchUser({ email_verified: true });
        if (status === 'authenticated') {
          await hydrate();
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof ApiClientError
            ? err.title ?? err.message
            : 'Unable to verify email. The link may be invalid or expired.',
        );
      } finally {
        if (!cancelled) {
          setVerifying(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [link, status, hydrate, patchUser]);

  async function onResend() {
    setError(null);
    setMessage(null);
    setVerificationUrl(null);
    setResending(true);
    try {
      const result = await sendVerificationRequest();
      setMessage(result.message);
      if (result.verification_url) {
        setVerificationUrl(result.verification_url);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to send verification email. Please try again.',
      );
    } finally {
      setResending(false);
    }
  }

  const homeHref = user ? homePathForRole(user.role) : '/login';
  const alreadyVerified = !!user?.email_verified;

  return (
    <div className="mt-8 space-y-5">
      {verifying ? (
        <p role="status" className="text-sm text-muted-foreground">
          Verifying your email…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {message ? (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {message}
        </p>
      ) : null}

      {verificationUrl ? (
        <p className="break-all rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-foreground/90">
          Dev verification link:{' '}
          <Link href={verificationUrl} className="font-medium underline">
            {verificationUrl}
          </Link>
        </p>
      ) : null}

      {!link && !verifying ? (
        <>
          {status === 'authenticated' && alreadyVerified ? (
            <p className="text-sm text-muted-foreground">Your email address is already verified.</p>
          ) : null}

          {status === 'authenticated' && !alreadyVerified ? (
            <>
              <p className="text-sm text-muted-foreground">
                Thanks for signing up. Please verify your email address by clicking the link we
                sent you. If you did not receive the email, we can send another.
              </p>
              <button
                type="button"
                disabled={resending}
                onClick={onResend}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            </>
          ) : null}

          {status === 'anonymous' ? (
            <p className="text-sm text-muted-foreground">
              Open the verification link from your email, or{' '}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                sign in
              </Link>{' '}
              to request a new link.
            </p>
          ) : null}
        </>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={homeHref}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {user ? 'Continue' : 'Back to sign in'}
        </Link>
      </p>
    </div>
  );
}
