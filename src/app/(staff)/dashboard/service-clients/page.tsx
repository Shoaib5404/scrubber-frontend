'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import {
  createServiceClient,
  getServiceClientScopeCatalog,
  listServiceClients,
  reissueServiceClient,
  revokeServiceClient,
  rotateServiceClient,
  type PlatformServiceClient,
  type ServiceClientScopeMeta,
} from '@/modules/service-clients-admin';
import { PaginationControls } from '@/components/layout/pagination-controls';
import { SmartTime } from '@/components/ui/smart-time';

const DEFAULT_SCOPES = ['reference:read'];

export default function ServiceClientsPage() {
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.UsersManage);

  const [rows, setRows] = useState<PlatformServiceClient[]>([]);
  const [catalog, setCatalog] = useState<ServiceClientScopeMeta[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [secretClientId, setSecretClientId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([...DEFAULT_SCOPES]);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    const [list, cat] = await Promise.all([
      listServiceClients(page),
      getServiceClientScopeCatalog().catch(() => [] as ServiceClientScopeMeta[]),
    ]);
    setRows(list.data);
    setLastPage(list.last_page);
    setCatalog(cat);
  }, [page]);

  useEffect(() => {
    if (!canManage) return;
    void reload().catch((err: Error) => setError(err.message));
  }, [canManage, reload]);

  if (!canManage) {
    return (
      <AppShell title="Service clients" basePath="/dashboard">
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage platform service clients.
        </p>
      </AppShell>
    );
  }

  function toggleScope(code: string) {
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return [...next];
    });
  }

  function flashSecret(client: PlatformServiceClient) {
    setSecret(client.plain_client_secret ?? null);
    setSecretClientId(client.client_id);
    setMessage(null);
    setError(null);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (scopes.length === 0) {
      setError('Select at least one scope.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await createServiceClient({
        name: name.trim() || 'Service client',
        scopes,
      });
      flashSecret(created);
      setName('');
      setScopes([...DEFAULT_SCOPES]);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title="Service clients" basePath="/dashboard">
      <p className="mb-4 text-sm text-muted-foreground">
        Platform credentials for NeoMD own apps (e.g. TeleWound). These clients are not tied
        to a customer tenant. Customer organizations manage their own credentials under
        Tenants and portal Integrations.
      </p>

      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-success">{message}</p> : null}

      {secret ? (
        <div
          className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm"
          data-testid="service-client-secret-flash"
        >
          <p className="font-medium text-amber-900">
            Copy the secret now — it will not be shown again.
          </p>
          {secretClientId ? (
            <p className="mt-2 font-mono text-xs break-all">
              Client ID: {secretClientId}
            </p>
          ) : null}
          <code className="mt-2 block break-all">{secret}</code>
        </div>
      ) : null}

      <form
        onSubmit={onCreate}
        className="mb-8 max-w-lg space-y-3 rounded-md border border-border bg-card p-4"
      >
        <h2 className="text-sm font-semibold text-foreground">Create service client</h2>
        <label className="block text-sm">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            placeholder="TeleWound"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-medium text-foreground">Scopes</legend>
          <div className="mt-2 space-y-2">
            {(catalog.length > 0
              ? catalog
              : DEFAULT_SCOPES.map((value) => ({
                  value,
                  label: value,
                  description: '',
                }))
            ).map((item) => (
              <label key={item.value} className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={scopes.includes(item.value)}
                  onChange={() => toggleScope(item.value)}
                />
                <span>
                  <span className="font-medium">{item.label}</span>
                  {item.description ? (
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Client ID</th>
              <th className="px-4 py-3 font-medium">Scopes</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Last used</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs break-all">{c.client_id}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {Array.isArray(c.scopes) ? c.scopes.join(', ') : '—'}
                </td>
                <td className="px-4 py-3">{c.is_active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <SmartTime value={c.last_used_at} empty="Never" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {c.is_active ? (
                      <>
                        <button
                          type="button"
                          className="text-sm underline"
                          onClick={() =>
                            void rotateServiceClient(c.id)
                              .then((updated) => {
                                flashSecret(updated);
                                return reload();
                              })
                              .catch((err: Error) => setError(err.message))
                          }
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          className="text-sm underline"
                          onClick={() =>
                            void reissueServiceClient(c.id)
                              .then((updated) => {
                                flashSecret(updated);
                                return reload();
                              })
                              .catch((err: Error) => setError(err.message))
                          }
                        >
                          Reissue
                        </button>
                        <button
                          type="button"
                          className="text-sm text-destructive underline"
                          onClick={() => {
                            if (!window.confirm(`Revoke ${c.name}?`)) return;
                            void revokeServiceClient(c.id)
                              .then(() => {
                                setSecret(null);
                                setMessage(`Revoked ${c.name}.`);
                                return reload();
                              })
                              .catch((err: Error) => setError(err.message));
                          }}
                        >
                          Revoke
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Revoked</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No platform service clients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        lastPage={lastPage}
        onPageChange={setPage}
        className="mt-3 rounded-xl border border-border bg-card px-3 shadow-sm"
      />

      <p className="mt-6 text-xs text-muted-foreground">
        <Link href="/dashboard/tenants" className="underline">
          Customer tenants
        </Link>{' '}
        stay separate from these platform clients.
      </p>
    </AppShell>
  );
}
