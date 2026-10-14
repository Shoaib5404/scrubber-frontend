'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { ApiClientError } from '@/lib/api/errors';
import {
  createUser,
  getUsersFormMeta,
  updateUser,
  type AdminUser,
  type UpsertUserInput,
  type UsersFormMeta,
} from '../api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type UserFormProps = {
  mode: 'create' | 'edit';
  user?: AdminUser;
};

function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

const baseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(255),
  email: z.email('Enter a valid email address.'),
  password: z.string(),
  passwordConfirmation: z.string(),
  role: z.string().min(1, 'Role is required.'),
  isActive: z.boolean(),
  plan: z.string(),
  subscriptionStatus: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
});

type FormValues = z.infer<typeof baseSchema>;

export function UserForm({ mode, user }: UserFormProps) {
  const router = useRouter();
  const [meta, setMeta] = useState<UsersFormMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      baseSchema.superRefine((values, ctx) => {
        if (mode === 'create' && values.password.length < 8) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Password must be at least 8 characters.',
          });
        }
        if (values.password && values.password !== values.passwordConfirmation) {
          ctx.addIssue({
            code: 'custom',
            path: ['passwordConfirmation'],
            message: 'Password confirmation does not match.',
          });
        }
        if (
          values.role === 'customer' &&
          values.startsAt &&
          values.endsAt &&
          values.endsAt < values.startsAt
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['endsAt'],
            message: 'Subscription end date must be on or after the start date.',
          });
        }
      }),
    [mode],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      passwordConfirmation: '',
      role: user?.role ?? 'customer',
      isActive: user?.is_active ?? true,
      plan: user?.plan ?? '',
      subscriptionStatus: user?.subscription_status ?? 'active',
      startsAt: toDateInput(user?.subscription_starts_at),
      endsAt: toDateInput(user?.subscription_ends_at),
    },
  });

  const role = watch('role');
  const showSubscription = role === 'customer';

  useEffect(() => {
    let cancelled = false;
    void getUsersFormMeta()
      .then((data) => {
        if (cancelled) return;
        setMeta(data);
        if (mode === 'create' && data.assignable_roles.length > 0) {
          const preferred =
            data.assignable_roles.find((r) => r.value === 'customer') ??
            data.assignable_roles[0];
          setValue('role', preferred.value);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMetaError(
            err instanceof ApiClientError
              ? err.title ?? err.message
              : 'Failed to load form options.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, setValue]);

  const roleOptions = useMemo(() => meta?.assignable_roles ?? [], [meta]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload: UpsertUserInput = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      is_active: values.isActive,
    };
    if (values.password) {
      payload.password = values.password;
    }
    if (values.role === 'customer') {
      payload.plan = values.plan || null;
      payload.subscription_status = values.subscriptionStatus;
      payload.subscription_starts_at = values.startsAt || null;
      payload.subscription_ends_at = values.endsAt || null;
    } else {
      payload.plan = null;
      payload.subscription_status = 'inactive';
      payload.subscription_starts_at = null;
      payload.subscription_ends_at = null;
    }

    try {
      if (mode === 'create') {
        await createUser(payload);
      } else if (user) {
        await updateUser(user.id, payload);
      }
      router.push('/dashboard/users');
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.title ?? err.message : 'Unable to save user.',
      );
    }
  }

  if (metaError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{metaError}</AlertDescription>
      </Alert>
    );
  }

  if (!meta) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    );
  }

  if (roleOptions.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          You do not have any assignable roles. Ask a Super Admin to grant user management access.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="flex max-w-3xl flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="user-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input id="user-name" maxLength={255} {...register('name')} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="user-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="user-email"
            type="email"
            maxLength={255}
            autoComplete="off"
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-password">
            Password{' '}
            {mode === 'edit' ? (
              <span className="font-normal text-muted-foreground">(leave blank to keep)</span>
            ) : (
              <span className="text-destructive">*</span>
            )}
          </Label>
          <Input
            id="user-password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-confirm">
            Confirm Password{' '}
            {mode === 'create' ? <span className="text-destructive">*</span> : null}
          </Label>
          <Input
            id="user-confirm"
            type="password"
            autoComplete="new-password"
            {...register('passwordConfirmation')}
          />
          {errors.passwordConfirmation ? (
            <p className="text-sm text-destructive">{errors.passwordConfirmation.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-role">
            Role <span className="text-destructive">*</span>
          </Label>
          <select
            id="user-role"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...register('role')}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end pb-1">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label htmlFor="user-active" className="inline-flex items-center gap-2 text-sm">
                <input
                  id="user-active"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                Account active
              </label>
            )}
          />
        </div>
      </div>

      {showSubscription ? (
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground">Subscription</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-plan">Plan</Label>
              <select
                id="user-plan"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                {...register('plan')}
              >
                <option value="">None</option>
                {meta.plans.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-status">
                Status <span className="text-destructive">*</span>
              </Label>
              <select
                id="user-status"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                {...register('subscriptionStatus')}
              >
                {meta.subscription_statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-starts">Starts at</Label>
              <Input id="user-starts" type="date" {...register('startsAt')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-ends">Ends at</Label>
              <Input id="user-ends" type="date" {...register('endsAt')} />
              {errors.endsAt ? (
                <p className="text-sm text-destructive">{errors.endsAt.message}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
              Saving…
            </>
          ) : mode === 'create' ? (
            'Create user'
          ) : (
            'Save changes'
          )}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">Cancel</Link>
        </Button>
        {mode === 'edit' && user?.role === 'customer' ? (
          <Link
            href={`/dashboard/users/${user.id}/api-clients`}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Manage API credentials
          </Link>
        ) : null}
      </div>
    </form>
  );
}
