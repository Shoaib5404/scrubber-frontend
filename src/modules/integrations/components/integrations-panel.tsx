'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import {
  createIntegrationCredentials,
  getIntegrations,
  rotateIntegrationSecret,
  type IntegrationApiClient,
} from '../api';

function formatLastUsed(iso: string | null): string {
  if (!iso) {
    return 'Never';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Never';
  }
  return date.toLocaleString();
}

export function IntegrationsPanel() {
  const [client, setClient] = useState<IntegrationApiClient | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [apiAccess, setApiAccess] = useState(true);
  const [secret, setSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIntegrations();
      setClient(data.api_client);
      setCanCreate(data.can_create !== false);
      setApiAccess(data.api_access !== false);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to load integrations.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await createIntegrationCredentials();
      setClient(result.api_client);
      setSecret(result.plain_client_secret);
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to create API credentials.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRotate() {
    if (
      !window.confirm(
        'Rotate your client secret? Existing API tokens will stop working.',
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await rotateIntegrationSecret();
      setClient(result.api_client);
      setSecret(result.plain_client_secret);
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Unable to rotate client secret.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading integrations…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-slate-600">
        Create your API Client ID and rotate your client secret for machine integrations.
      </p>

      {message ? (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {secret && client ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900">
            Copy your client secret now
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            This secret is shown only once. Store it securely.
          </p>
          <div className="mt-4 space-y-3 font-mono text-sm">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-amber-700">
                Client ID
              </div>
              <div className="break-all rounded-md border border-amber-200 bg-white px-3 py-2">
                {client.client_id}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-amber-700">
                Client Secret
              </div>
              <div className="break-all rounded-md border border-amber-200 bg-white px-3 py-2">
                {secret}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!client ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">API credentials</h3>
          {!apiAccess ? (
            <p className="mt-2 text-sm text-slate-600">
              API access is not included in your subscription. Please contact support.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                No API credentials exist for your organization yet. Create a Client ID and
                secret to call the Scrubber API.
              </p>
              {canCreate ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onCreate()}
                  className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy ? 'Creating…' : 'Create API credentials'}
                </button>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Ask your tenant administrator to create API credentials.
                </p>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">API credentials</h3>
              <p className="mt-1 text-xs text-slate-500">
                Last used: {formatLastUsed(client.last_used_at)}
              </p>
            </div>
            {client.is_active ? (
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Active
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                Revoked
              </span>
            )}
          </div>

          <div className="space-y-4 p-6">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Client ID
              </div>
              <div className="break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm">
                {client.client_id}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Client Secret
              </div>
              <p className="mb-3 text-sm text-slate-500">
                Your Client ID stays the same. Rotating creates a new secret and invalidates
                existing API tokens.
              </p>
              {client.is_active ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onRotate()}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy ? 'Rotating…' : 'Rotate client secret'}
                </button>
              ) : (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  These credentials are revoked. Create new credentials or contact support.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
