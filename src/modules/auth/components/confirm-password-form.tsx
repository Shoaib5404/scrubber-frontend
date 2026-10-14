'use client';

import Link from 'next/link';
import { FormEvent, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { ApiClientError } from '@/lib/api/errors';
import { tokenManager } from '@/lib/auth/token-manager';
import { confirmPasswordRequest } from '../api';
import { useAuthStore } from '../store/auth-store';
import { homePathForRole } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={passwordId}>Password</Label>
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription id={errorId}>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
            Confirming…
          </>
        ) : (
          'Confirm'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
