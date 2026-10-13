'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import {
  createUser,
  getUsersFormMeta,
  updateUser,
  type AdminUser,
  type UpsertUserInput,
  type UsersFormMeta,
} from '../api';

type UserFormProps = {
  mode: 'create' | 'edit';
  user?: AdminUser;
};

function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function UserForm({ mode, user }: UserFormProps) {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const roleId = useId();
  const activeId = useId();
  const planId = useId();
  const statusId = useId();
  const startsId = useId();
  const endsId = useId();

  const [meta, setMeta] = useState<UsersFormMeta | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState(user?.role ?? 'customer');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [plan, setPlan] = useState(user?.plan ?? '');
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    user?.subscription_status ?? 'active',
  );
  const [startsAt, setStartsAt] = useState(toDateInput(user?.subscription_starts_at));
  const [endsAt, setEndsAt] = useState(toDateInput(user?.subscription_ends_at));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

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
          setRole(preferred.value);
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
  }, [mode]);

  const showSubscription = role === 'customer';
  const roleOptions = useMemo(() => meta?.assignable_roles ?? [], [meta]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === 'create' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password && password !== passwordConfirmation) {
      setError('Password confirmation does not match.');
      return;
    }
    if (showSubscription && startsAt && endsAt && endsAt < startsAt) {
      setError('Subscription end date must be on or after the start date.');
      return;
    }

    const payload: UpsertUserInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      is_active: isActive,
    };
    if (password) {
      payload.password = password;
    }
    if (showSubscription) {
      payload.plan = plan || null;
      payload.subscription_status = subscriptionStatus;
      payload.subscription_starts_at = startsAt || null;
      payload.subscription_ends_at = endsAt || null;
    } else {
      payload.plan = null;
      payload.subscription_status = 'inactive';
      payload.subscription_starts_at = null;
      payload.subscription_ends_at = null;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await createUser(payload);
      } else if (user) {
        await updateUser(user.id, payload);
      }
      router.push('/dashboard/users');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to save user.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (metaError) {
    return <p className="text-sm text-red-700">{metaError}</p>;
  }

  if (!meta) {
    return <p className="text-sm text-slate-600">Loading form…</p>;
  }

  if (roleOptions.length === 0) {
    return (
      <p className="text-sm text-amber-800">
        You do not have any assignable roles. Ask a Super Admin to grant user management access.
      </p>
    );
  }

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400';

  return (
    <form className="max-w-3xl space-y-6" onSubmit={onSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={nameId} className="block text-sm font-medium text-slate-800">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            id={nameId}
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={emailId} className="block text-sm font-medium text-slate-800">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            id={emailId}
            type="email"
            required
            maxLength={255}
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-slate-800">
            Password{' '}
            {mode === 'edit' ? (
              <span className="font-normal text-slate-500">(leave blank to keep)</span>
            ) : (
              <span className="text-rose-500">*</span>
            )}
          </label>
          <input
            id={passwordId}
            type="password"
            required={mode === 'create'}
            minLength={mode === 'create' ? 8 : undefined}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={confirmId} className="block text-sm font-medium text-slate-800">
            Confirm Password{' '}
            {mode === 'create' ? <span className="text-rose-500">*</span> : null}
          </label>
          <input
            id={confirmId}
            type="password"
            required={mode === 'create'}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={roleId} className="block text-sm font-medium text-slate-800">
            Role <span className="text-rose-500">*</span>
          </label>
          <select
            id={roleId}
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end pb-2">
          <label htmlFor={activeId} className="inline-flex items-center gap-2 text-sm text-slate-800">
            <input
              id={activeId}
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Account active
          </label>
        </div>
      </div>

      {showSubscription ? (
        <section className="space-y-4 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={planId} className="block text-sm font-medium text-slate-800">
                Plan
              </label>
              <select
                id={planId}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {meta.plans.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={statusId} className="block text-sm font-medium text-slate-800">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                id={statusId}
                required
                value={subscriptionStatus}
                onChange={(e) => setSubscriptionStatus(e.target.value)}
                className={inputClass}
              >
                {meta.subscription_statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={startsId} className="block text-sm font-medium text-slate-800">
                Starts at
              </label>
              <input
                id={startsId}
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={endsId} className="block text-sm font-medium text-slate-800">
                Ends at
              </label>
              <input
                id={endsId}
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
        </button>
        <Link
          href="/dashboard/users"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        {mode === 'edit' && user?.role === 'customer' ? (
          <Link
            href={`/dashboard/users/${user.id}/api-clients`}
            className="text-sm font-medium text-slate-800 underline-offset-2 hover:underline"
          >
            Manage API credentials
          </Link>
        ) : null}
      </div>
    </form>
  );
}
