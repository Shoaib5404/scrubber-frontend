'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import {
  getTenant,
  getTenantFeatureCatalog,
  inviteTenantUser,
  listTenantUsers,
  resendTenantInvite,
  updateTenant,
  withImpliedApiAccess,
  type AdminTenant,
  type TenantFeatureMeta,
  type TenantMember,
} from '@/modules/tenants-admin';

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = Number(params.id);
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.TenantsManage);

  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [catalog, setCatalog] = useState<TenantFeatureMeta[]>([]);
  const [draftFeatures, setDraftFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingFeatures, setSavingFeatures] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('customer');

  async function reload() {
    const [t, users, cat] = await Promise.all([
      getTenant(tenantId),
      listTenantUsers(tenantId),
      getTenantFeatureCatalog().catch(() => [] as TenantFeatureMeta[]),
    ]);
    setTenant(t);
    setMembers(users);
    setCatalog(cat);
    setDraftFeatures(t.features ?? []);
  }

  useEffect(() => {
    if (!canManage || !Number.isFinite(tenantId)) return;
    void reload().catch((err: Error) => setError(err.message));
  }, [canManage, tenantId]);

  if (!canManage) {
    return (
      <AppShell title="Tenant" basePath="/dashboard">
        <p className="text-sm text-muted-foreground">You do not have permission to manage tenants.</p>
      </AppShell>
    );
  }

  function toggleFeature(code: string) {
    setDraftFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return withImpliedApiAccess([...next]);
    });
  }

  async function saveFeatures() {
    setSavingFeatures(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateTenant(tenantId, {
        features: withImpliedApiAccess(draftFeatures),
      });
      setTenant(updated);
      setDraftFeatures(updated.features ?? []);
      setMessage('Features updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update features');
    } finally {
      setSavingFeatures(false);
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const data = await inviteTenantUser(tenantId, {
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.trim(),
        role: inviteRole,
      });
      const sentTo = inviteEmail.trim();
      setInviteEmail('');
      setInviteName('');
      if (data.email_warning) {
        setError(data.email_warning);
        setMessage(
          data.invite_url ? `Invite link (copy): ${data.invite_url}` : null,
        );
      } else {
        setMessage(`Invite sent to ${sentTo}.`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
  }

  return (
    <AppShell title={tenant?.name ?? 'Tenant'} basePath="/dashboard">
      <div className="mb-4">
        <Link href="/dashboard/tenants" className="text-sm text-muted-foreground underline">
          ← All tenants
        </Link>
      </div>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-success">{message}</p> : null}

      {tenant ? (
        <div className="mb-6 space-y-4 rounded-md border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Slug: {tenant.slug}</div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm"
              onClick={() =>
                void updateTenant(tenantId, {
                  status: tenant.status === 'active' ? 'suspended' : 'active',
                })
                  .then(reload)
                  .catch((err: Error) => setError(err.message))
              }
            >
              {tenant.status === 'active' ? 'Suspend' : 'Activate'}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm"
              onClick={() =>
                void updateTenant(tenantId, {
                  subscription_status:
                    tenant.subscription_status === 'active' ? 'inactive' : 'active',
                })
                  .then(reload)
                  .catch((err: Error) => setError(err.message))
              }
            >
              Subscription: {tenant.subscription_status} (toggle)
            </button>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-foreground">Subscription features</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecting Batches API or Reference API also enables API access.
            </p>
            <div className="mt-2 space-y-2">
              {(catalog.length > 0
                ? catalog
                : (tenant.features ?? []).map((value) => ({
                    value,
                    label: value,
                    description: '',
                    group: '',
                  }))
              ).map((item) => (
                <label key={item.value} className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={draftFeatures.includes(item.value)}
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
            </div>
            <button
              type="button"
              disabled={savingFeatures}
              onClick={() => void saveFeatures()}
              className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {savingFeatures ? 'Saving…' : 'Save features'}
            </button>
          </fieldset>
        </div>
      ) : null}

      <h2 className="mb-2 text-lg font-semibold text-foreground">Members</h2>
      <div className="mb-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border">
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.role}</td>
                <td className="px-4 py-3">
                  {m.is_active ? 'Active' : m.invite_pending ? 'Invite pending' : 'Inactive'}
                </td>
                <td className="px-4 py-3 text-right">
                  {!m.is_active ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-foreground underline"
                      onClick={() =>
                        void resendTenantInvite(tenantId, m.email)
                          .then((data) => {
                            if (data.email_warning) {
                              setError(data.email_warning);
                              setMessage(
                                data.invite_url
                                  ? `Invite link (copy): ${data.invite_url}`
                                  : null,
                              );
                              return;
                            }
                            setError(null);
                            setMessage(`Invite resent to ${m.email}.`);
                          })
                          .catch((err: Error) => setError(err.message))
                      }
                    >
                      Resend invite
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={onInvite} className="max-w-lg space-y-3 rounded-md border border-border bg-card p-4">
        <h3 className="font-medium text-foreground">Invite member</h3>
        <input
          required
          type="email"
          placeholder="Email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          placeholder="Name"
          value={inviteName}
          onChange={(e) => setInviteName(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="customer">Customer</option>
          <option value="tenant_admin">Tenant admin</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Send invite
        </button>
      </form>
    </AppShell>
  );
}
