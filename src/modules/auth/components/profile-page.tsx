'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api/errors';
import { AppShell } from '@/modules/batches/components/app-shell';
import {
  deleteProfileRequest,
  getProfileRequest,
  updatePasswordRequest,
  updateProfileRequest,
} from '../api';
import { useAuthStore } from '../store/auth-store';
import { homePathForRole, isStaffRole } from '../types';

export function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const clear = useAuthStore((s) => s.clear);
  const basePath = user && isStaffRole(user.role) ? '/dashboard' : '/portal';

  const nameId = useId();
  const emailId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const deletePasswordId = useId();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfileRequest();
        if (cancelled) {
          return;
        }
        setName(profile.name);
        setEmail(profile.email);
        patchUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          email_verified: profile.email_verified,
        });
      } catch {
        // RequireAuth / hydrate already gate access; keep local store values.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patchUser]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setProfileLoading(true);
    try {
      const profile = await updateProfileRequest(name.trim());
      setName(profile.name);
      setEmail(profile.email);
      patchUser({
        name: profile.name,
        email: profile.email,
        email_verified: profile.email_verified,
      });
      setProfileMessage('Saved.');
    } catch (err) {
      setProfileError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to update profile.',
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function onSavePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    if (newPassword !== passwordConfirmation) {
      setPasswordError('Password confirmation does not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await updatePasswordRequest({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      });
      setPasswordMessage(result.message || 'Saved.');
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
    } catch (err) {
      setPasswordError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to update password.',
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function onDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deleteProfileRequest(deletePassword);
      clear();
      router.replace('/login');
    } catch (err) {
      setDeleteError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to delete account.',
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <AppShell title="Profile" basePath={basePath}>
      <div className="space-y-6">
        <section className="max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Profile Information</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your account&apos;s profile information.
          </p>
          <form className="mt-6 space-y-5" onSubmit={onSaveProfile} noValidate>
            <div>
              <label htmlFor={nameId} className="block text-sm font-medium text-slate-800">
                Name
              </label>
              <input
                id={nameId}
                name="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-slate-800">
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                disabled
                readOnly
                value={email}
                className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
              />
              <p className="mt-1 text-sm text-slate-500">
                Email cannot be changed. Contact an administrator if you need a different
                address.
              </p>
            </div>
            {profileError ? (
              <p role="alert" className="text-sm text-red-700">
                {profileError}
              </p>
            ) : null}
            {profileMessage ? (
              <p role="status" className="text-sm text-emerald-700">
                {profileMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileLoading ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>

        <section className="max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Update Password</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ensure your account is using a long, random password to stay secure.
          </p>
          <form className="mt-6 space-y-5" onSubmit={onSavePassword} noValidate>
            <div>
              <label
                htmlFor={currentPasswordId}
                className="block text-sm font-medium text-slate-800"
              >
                Current Password
              </label>
              <input
                id={currentPasswordId}
                name="current_password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label htmlFor={newPasswordId} className="block text-sm font-medium text-slate-800">
                New Password
              </label>
              <input
                id={newPasswordId}
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label
                htmlFor={confirmPasswordId}
                className="block text-sm font-medium text-slate-800"
              >
                Confirm Password
              </label>
              <input
                id={confirmPasswordId}
                name="password_confirmation"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            {passwordError ? (
              <p role="alert" className="text-sm text-red-700">
                {passwordError}
              </p>
            ) : null}
            {passwordMessage ? (
              <p role="status" className="text-sm text-emerald-700">
                {passwordMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordLoading ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>

        <section className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Delete Account</h2>
            <p className="mt-1 text-sm text-slate-600">
              Once your account is deleted, all of its resources and data will be permanently
              deleted. Before deleting your account, please download any data or information that
              you wish to retain.
            </p>
          </div>
          {!deleteOpen ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Delete Account
            </button>
          ) : (
            <form className="space-y-4 border-t border-slate-200 pt-4" onSubmit={onDeleteAccount}>
              <p className="text-sm text-slate-700">
                Are you sure you want to delete your account? Enter your password to confirm.
              </p>
              <div>
                <label htmlFor={deletePasswordId} className="sr-only">
                  Password
                </label>
                <input
                  id={deletePasswordId}
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              {deleteError ? (
                <p role="alert" className="text-sm text-red-700">
                  {deleteError}
                </p>
              ) : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteLoading ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </form>
          )}
        </section>

        <p className="text-sm text-slate-500">
          <button
            type="button"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
            onClick={() => router.push(user ? homePathForRole(user.role) : '/login')}
          >
            Back to home
          </button>
        </p>
      </div>
    </AppShell>
  );
}
