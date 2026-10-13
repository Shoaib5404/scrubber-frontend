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
        <p className="text-sm text-slate-600">
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
      <p className="mb-4 text-sm text-slate-600">
        Platform credentials for NeoMD own apps (e.g. TeleWound). Unbound from customer
        tenants — use <code className="text-xs">POST /api/v1/auth/token</code> then call
        APIs with the Bearer token. Customer orgs use Tenants + portal Integrations instead.
      </p>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}

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
        className="mb-8 max-w-lg space-y-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Create service client</h2>
        <label className="block text-sm">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="TeleWound"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-medium text-slate-800">Scopes</legend>
          <div className="mt-2 space-y-2">
            {(catalog.length > 0
              ? catalog
              : DEFAULT_SCOPES.map((value) => ({
                  value,
                  label: value,
                  description: '',
                }))
            ).map((item) => (
              <label key={item.value} className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={scopes.includes(item.value)}
                  onChange={() => toggleScope(item.value)}
                />
                <span>
                  <span className="font-medium">{item.label}</span>
                  {item.description ? (
                    <span className="block text-xs text-slate-500">{item.description}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
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
              <tr key={c.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs break-all">{c.client_id}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {Array.isArray(c.scopes) ? c.scopes.join(', ') : '—'}
                </td>
                <td className="px-4 py-3">{c.is_active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.last_used_at ? new Date(c.last_used_at).toLocaleString() : 'Never'}
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
                          className="text-sm text-red-700 underline"
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
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No platform service clients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="self-center text-sm text-slate-600">
            Page {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-slate-500">
        CLI alternative:{' '}
        <code>npx nest-commander reference-api:issue &quot;My App&quot;</code>
      </p>
      <p className="mt-1 text-xs text-slate-500">
        <Link href="/dashboard/tenants" className="underline">
          Customer tenants
        </Link>{' '}
        stay separate from these platform clients.
      </p>
    </AppShell>
  );
}
