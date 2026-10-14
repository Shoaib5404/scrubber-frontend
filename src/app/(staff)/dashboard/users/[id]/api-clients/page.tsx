'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import {
  createUserApiClient,
  getUser,
  getUserApiClient,
  revokeUserApiClient,
  rotateUserApiClient,
  type AdminApiClient,
  type AdminUser,
} from '@/modules/users-admin/api';

export default function UserApiClientsPage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [client, setClient] = useState<AdminApiClient | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [name, setName] = useState('API Client');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [u, c] = await Promise.all([getUser(userId), getUserApiClient(userId)]);
    setUser(u);
    setClient(c);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void reload().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function onCreate() {
    setError(null);
    try {
      const created = await createUserApiClient(userId, name);
      setClient(created);
      setSecret(created.plain_client_secret ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create failed');
    }
  }

  async function onRotate() {
    if (!client) return;
    setError(null);
    try {
      const rotated = await rotateUserApiClient(userId, client.id);
      setClient(rotated);
      setSecret(rotated.plain_client_secret ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rotate failed');
    }
  }

  async function onRevoke() {
    if (!client) return;
    setError(null);
    try {
      await revokeUserApiClient(userId, client.id);
      setSecret(null);
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
    }
  }

  return (
    <RequireAuth staffOnly>
      <AppShell title={`API clients — ${user?.email ?? userId}`} basePath="/dashboard">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {secret ? (
          <div
            className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
            data-testid="api-client-secret-flash"
          >
            <p className="font-medium">Copy the secret now — it will not be shown again.</p>
            <code className="mt-2 block break-all">{secret}</code>
          </div>
        ) : null}

        {client ? (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {client.name}
            </p>
            <p>
              <span className="text-muted-foreground">Client ID:</span>{' '}
              <code>{client.client_id}</code>
            </p>
            <p>
              <span className="text-muted-foreground">Active:</span> {client.is_active ? 'yes' : 'no'}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5"
                onClick={() => void onRotate()}
              >
                Rotate secret
              </button>
              <button
                type="button"
                className="rounded-md border border-red-300 px-3 py-1.5 text-red-700"
                onClick={() => void onRevoke()}
              >
                Revoke
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex max-w-md flex-col gap-2">
            <label className="text-sm">
              Client name
              <input
                className="mt-1 w-full rounded-md border border-border px-2 py-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
              onClick={() => void onCreate()}
            >
              Create API credentials
            </button>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
