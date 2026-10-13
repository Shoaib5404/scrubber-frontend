'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import {
  createTenant,
  DEFAULT_TENANT_FEATURES,
  getTenantFeatureCatalog,
  withImpliedApiAccess,
  type TenantFeatureMeta,
} from '@/modules/tenants-admin';

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
        <p className="text-sm text-slate-600">You do not have permission to manage tenants.</p>
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
    <AppShell title="New tenant" basePath="/dashboard">
      <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 rounded-md border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-800">Organization name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800">Subscription</label>
          <select
            value={subscription}
            onChange={(e) => setSubscription(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-slate-800">Features</legend>
          <p className="mt-1 text-xs text-slate-500">
            Selecting Batches API or Reference API also enables API access.
          </p>
          <div className="mt-2 space-y-2">
            {(catalog.length > 0
              ? catalog
              : DEFAULT_TENANT_FEATURES.map((value) => ({
                  value,
                  label: value,
                  description: '',
                  group: '',
                }))
            ).map((item) => (
              <label key={item.value} className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={features.includes(item.value)}
                  onChange={() => toggleFeature(item.value)}
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
        <div>
          <label className="block text-sm font-medium text-slate-800">First admin email</label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Optional — sends invite email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800">First admin name</label>
          <input
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create tenant'}
          </button>
          <Link href="/dashboard/tenants" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
