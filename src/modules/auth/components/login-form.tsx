'use client';

import Link from 'next/link';
import { FormEvent, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import { useAuthStore } from '../store/auth-store';
import { ACCOUNT_DEACTIVATED_MESSAGE } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2Icon } from 'lucide-react';

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
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={passwordId}>Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {resetNotice ? (
        <Alert>
          <AlertDescription>
            Your password has been reset. You can sign in with your new password.
          </AlertDescription>
        </Alert>
      ) : null}

      {deactivatedNotice && !error ? (
        <Alert variant="destructive" data-testid="account-deactivated-notice">
          <AlertDescription id={errorId}>{ACCOUNT_DEACTIVATED_MESSAGE}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" data-testid="login-error">
          <AlertDescription id={errorId}>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}
