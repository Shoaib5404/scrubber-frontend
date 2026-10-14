'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { ApiClientError } from '@/lib/api/errors';
import {
  createIntegrationCredentials,
  getIntegrations,
  rotateIntegrationSecret,
  type IntegrationApiClient,
} from '../api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/layout/confirm-dialog';

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
  const [confirmRotate, setConfirmRotate] = useState(false);

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
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await rotateIntegrationSecret();
      setClient(result.api_client);
      setSecret(result.plain_client_secret);
      setMessage(result.message);
      setConfirmRotate(false);
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
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Create your API Client ID and rotate your client secret for machine integrations.
      </p>

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {secret && client ? (
        <Alert className="border-warning/30 bg-warning/10 text-warning">
          <AlertTitle>Copy your client secret now</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 text-warning">
            <span>This secret is shown only once. Store it securely.</span>
            <div className="flex flex-col gap-3 font-mono text-sm text-foreground">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Client ID
                </div>
                <div className="break-all rounded-md border border-border bg-card px-3 py-2">
                  {client.client_id}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Client Secret
                </div>
                <div className="break-all rounded-md border border-border bg-card px-3 py-2">
                  {secret}
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {!client ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API credentials</CardTitle>
            <CardDescription>
              {!apiAccess
                ? 'API access is not included in your subscription. Please contact support.'
                : 'No API credentials exist for your organization yet.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiAccess && canCreate ? (
              <Button type="button" disabled={busy} onClick={() => void onCreate()}>
                {busy ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create API credentials'
                )}
              </Button>
            ) : apiAccess ? (
              <p className="text-sm text-muted-foreground">
                Ask your tenant administrator to create API credentials.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">API credentials</CardTitle>
              <CardDescription>
                Last used: {formatLastUsed(client.last_used_at)}
              </CardDescription>
            </div>
            {client.is_active ? (
              <Badge className="rounded-md bg-success/10 text-success">Active</Badge>
            ) : (
              <Badge variant="destructive" className="rounded-md">
                Revoked
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Client ID
              </div>
              <div className="break-all rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-sm">
                {client.client_id}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Client Secret
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Your Client ID stays the same. Rotating creates a new secret and invalidates
                existing API tokens.
              </p>
              {client.is_active ? (
                <Button type="button" disabled={busy} onClick={() => setConfirmRotate(true)}>
                  {busy ? (
                    <>
                      <Loader2Icon data-icon="inline-start" className="animate-spin" />
                      Rotating…
                    </>
                  ) : (
                    'Rotate client secret'
                  )}
                </Button>
              ) : (
                <Alert>
                  <AlertDescription>
                    These credentials are revoked. Create new credentials or contact support.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmRotate}
        onOpenChange={setConfirmRotate}
        title="Rotate client secret?"
        description="Existing API tokens will stop working after rotation."
        confirmLabel="Rotate secret"
        destructive
        busy={busy}
        onConfirm={() => void onRotate()}
      />
    </div>
  );
}
