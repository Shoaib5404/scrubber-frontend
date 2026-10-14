'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError } from '@/lib/api/errors';
import { forgotPasswordRequest } from '../api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2Icon } from 'lucide-react';

const schema = z.object({
  email: z.email('Enter a valid email address.'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const emailId = useId();
  const errorId = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setMessage(null);
    try {
      const result = await forgotPasswordRequest(values.email.trim());
      setMessage(result.message);
    } catch (err) {
      setServerError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to send reset link. Please try again.',
      );
    }
  }

  return (
    <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          aria-invalid={errors.email || serverError ? true : undefined}
          aria-describedby={errors.email || serverError ? errorId : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription id={errorId}>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
            Sending…
          </>
        ) : (
          'Email password reset link'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
