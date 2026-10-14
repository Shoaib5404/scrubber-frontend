'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import {
  createTenant,
  DEFAULT_TENANT_FEATURES,
  getTenantFeatureCatalog,
  withImpliedApiAccess,
  type TenantFeatureMeta,
} from '@/modules/tenants-admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewTenantPage() {
  const router = useRouter();
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.TenantsManage);
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [subscription, setSubscription] = useState('active');
  const [features, setFeatures] = useState<string[]>([...DEFAULT_TENANT_FEATURES]);
  const [catalog, setCatalog] = useState<TenantFeatureMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canManage) return;
    void getTenantFeatureCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, [canManage]);

  if (!canManage) {
    return (
      <AppShell title="New tenant" basePath="/dashboard">
        <Alert>
          <AlertDescription>You do not have permission to manage tenants.</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  function toggleFeature(code: string) {
    setFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return withImpliedApiAccess([...next]);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await createTenant({
        name: name.trim(),
        subscription_status: subscription,
        features: withImpliedApiAccess(features),
        admin_email: adminEmail.trim() || undefined,
        admin_name: adminName.trim() || undefined,
      });
      router.push(`/dashboard/tenants/${data.tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="New tenant" description="Create an organization and optional first admin." basePath="/dashboard">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Tenant details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-name">Organization name</Label>
              <Input
                id="tenant-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-subscription">Subscription</Label>
              <select
                id="tenant-subscription"
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-foreground">Features</legend>
              <p className="text-xs text-muted-foreground">
                Selecting Batches API or Reference API also enables API access.
              </p>
              {(catalog.length > 0
                ? catalog
                : DEFAULT_TENANT_FEATURES.map((value) => ({
                    value,
                    label: value,
                    description: '',
                    group: '',
                  }))
              ).map((item) => (
                <label key={item.value} className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-border"
                    checked={features.includes(item.value)}
                    onChange={() => toggleFeature(item.value)}
                  />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    {item.description ? (
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-email">First admin email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Optional — sends invite email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-name">First admin name</Label>
              <Input
                id="admin-name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create tenant'
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/tenants">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
