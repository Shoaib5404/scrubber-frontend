'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <AppShell title="Profile" description="Manage your account settings." basePath={basePath}>
      <div className="flex flex-col gap-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Profile information</CardTitle>
            <CardDescription>Update your account&apos;s profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSaveProfile} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={nameId}>Name</Label>
                <Input
                  id={nameId}
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={emailId}>Email</Label>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  disabled
                  readOnly
                  value={email}
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact an administrator if you need a different
                  address.
                </p>
              </div>
              {profileError ? (
                <Alert variant="destructive">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              ) : null}
              {profileMessage ? (
                <Alert>
                  <AlertDescription>{profileMessage}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" disabled={profileLoading} className="w-fit">
                {profileLoading ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Update password</CardTitle>
            <CardDescription>
              Ensure your account is using a long, random password to stay secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSavePassword} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={currentPasswordId}>Current password</Label>
                <Input
                  id={currentPasswordId}
                  name="current_password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={newPasswordId}>New password</Label>
                <Input
                  id={newPasswordId}
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={confirmPasswordId}>Confirm password</Label>
                <Input
                  id={confirmPasswordId}
                  name="password_confirmation"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>
              {passwordError ? (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              ) : null}
              {passwordMessage ? (
                <Alert>
                  <AlertDescription>{passwordMessage}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" disabled={passwordLoading} className="w-fit">
                {passwordLoading ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="max-w-xl border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Delete account</CardTitle>
            <CardDescription>
              Once your account is deleted, all of its resources and data will be permanently
              deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!deleteOpen ? (
              <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete account
              </Button>
            ) : (
              <form className="flex flex-col gap-4 border-t border-border pt-4" onSubmit={onDeleteAccount}>
                <p className="text-sm text-foreground/90">
                  Are you sure you want to delete your account? Enter your password to confirm.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={deletePasswordId}>Password</Label>
                  <Input
                    id={deletePasswordId}
                    name="password"
                    type="password"
                    required
                    placeholder="Password"
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
                {deleteError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeleteOpen(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={deleteLoading}>
                    {deleteLoading ? (
                      <>
                        <Loader2Icon data-icon="inline-start" className="animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      'Delete account'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="link"
          className="h-auto w-fit px-0"
          onClick={() => router.push(user ? homePathForRole(user.role) : '/login')}
        >
          Back to home
        </Button>
      </div>
    </AppShell>
  );
}
