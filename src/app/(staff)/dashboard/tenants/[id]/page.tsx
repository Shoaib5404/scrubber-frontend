'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import { AppSelect } from '@/components/forms';
import { KpiStatGrid, PeriodFilter, periodCaption } from '@/modules/dashboard';
import { RecentBatchesPanel } from '@/modules/dashboard/components/recent-batches-panel';
import {
  getTenantFeatureCatalog,
  getTenantOverview,
  inviteTenantUser,
  resendTenantInvite,
  updateTenant,
  withImpliedApiAccess,
  type TenantFeatureMeta,
} from '@/modules/tenants-admin';
import {
  MemberActivityTable,
  type PeriodFilterValue,
  type TenantOverview,
} from '@/modules/team';
import { friendlyError } from '@/modules/batches/components/async-state';
import { ErrorState } from '@/components/layout/error-state';
import { TableSkeleton } from '@/components/layout/table-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = Number(params.id);
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.TenantsManage);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    period: '1m',
  });
  const [overview, setOverview] = useState<TenantOverview | null>(null);
  const [catalog, setCatalog] = useState<TenantFeatureMeta[]>([]);
  const [draftFeatures, setDraftFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingFeatures, setSavingFeatures] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('customer');

  const reload = useCallback(async () => {
    if (!canManage || !Number.isFinite(tenantId)) return;
    setLoading(true);
    setError(null);
    try {
      const [next, cat] = await Promise.all([
        getTenantOverview(tenantId, periodFilter),
        getTenantFeatureCatalog().catch(() => [] as TenantFeatureMeta[]),
      ]);
      setOverview(next);
      setCatalog(cat);
      setDraftFeatures(next.tenant.features ?? []);
    } catch (err) {
      setError(friendlyError(err));
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [canManage, tenantId, periodFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote fetch
    void reload();
  }, [reload]);

  if (!canManage) {
    return (
      <AppShell title="Tenant" basePath="/dashboard">
        <ErrorState message="You do not have permission to manage tenants." />
      </AppShell>
    );
  }

  function toggleFeature(code: string) {
    setDraftFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
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
      setDraftFeatures(updated.features ?? []);
      setMessage('Features updated.');
      await reload();
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

  const tenant = overview?.tenant;
  const stats = overview?.stats;
  const inFlight = stats
    ? stats.batches.pending +
      stats.batches.processing +
      stats.batches.parsed +
      stats.batches.validating
    : 0;
  return (
    <AppShell
      title={tenant?.name ?? 'Tenant'}
      description="Tenant overview, member activity, and subscription controls."
      basePath="/dashboard"
    >
      <div className="mb-4">
        <Link
          href="/dashboard/tenants"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← All tenants
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert className="mb-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <TableSkeleton rows={6} columns={4} /> : null}

      {!loading && overview && tenant && stats ? (
        <div className="flex flex-col gap-8" data-testid="tenant-overview">
          <div className="flex w-full flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Slug: {tenant.slug}</p>
              <p className="text-xs text-muted-foreground">
                Status: {tenant.status} · Subscription: {tenant.subscription_status}
              </p>
            </div>
            <PeriodFilter
              id="tenant-period"
              value={periodFilter}
              onChange={setPeriodFilter}
            />
          </div>

          <KpiStatGrid
            caption={periodCaption(periodFilter)}
            items={[
              { label: 'Batches', value: stats.batches.total },
              { label: 'In progress', value: inFlight },
              { label: 'Failed batches', value: stats.batches.error },
              { label: 'Claims', value: stats.claims.total },
              { label: 'Claim errors', value: stats.claims.error },
              {
                label: 'Users',
                value: stats.users.company_user_count,
              },
            ]}
          />

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={`/dashboard/batches?tenant_id=${tenantId}`}>
                View tenant batches
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void updateTenant(tenantId, {
                  status: tenant.status === 'active' ? 'suspended' : 'active',
                })
                  .then(() => reload())
                  .catch((err: Error) => setError(err.message))
              }
            >
              {tenant.status === 'active' ? 'Suspend tenant' : 'Activate tenant'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void updateTenant(tenantId, {
                  subscription_status:
                    tenant.subscription_status === 'active' ? 'inactive' : 'active',
                })
                  .then(() => reload())
                  .catch((err: Error) => setError(err.message))
              }
            >
              Toggle subscription ({tenant.subscription_status})
            </Button>
          </div>

          <RecentBatchesPanel
            batches={overview.recent_batches}
            basePath="/dashboard"
            showTenant={false}
            viewAllHref={`/dashboard/batches?tenant_id=${tenantId}`}
          />

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">Member activity</h2>
            <MemberActivityTable
              members={overview.members}
              onResendInvite={(email) =>
                void resendTenantInvite(tenantId, email)
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
                    setMessage(`Invite resent to ${email}.`);
                  })
                  .catch((err: Error) => setError(err.message))
              }
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Selecting Batches API or Reference API also enables API access.
                </p>
                <div className="space-y-2">
                  {(catalog.length > 0
                    ? catalog
                    : (tenant.features ?? []).map((value) => ({
                        value,
                        label: value,
                        description: '',
                        group: '',
                      }))
                  ).map((item) => (
                    <label
                      key={item.value}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={draftFeatures.includes(item.value)}
                        onChange={() => toggleFeature(item.value)}
                      />
                      <span>
                        <span className="font-medium">{item.label}</span>
                        {item.description ? (
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  disabled={savingFeatures}
                  onClick={() => void saveFeatures()}
                  size="sm"
                >
                  {savingFeatures ? 'Saving…' : 'Save features'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invite member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onInvite} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      required
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invite-name">Name</Label>
                    <Input
                      id="invite-name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>
                  <AppSelect
                    id="invite-role"
                    label="Role"
                    value={inviteRole}
                    size="sm"
                    onValueChange={setInviteRole}
                    options={[
                      { value: 'customer', label: 'Customer' },
                      { value: 'tenant_admin', label: 'Tenant admin' },
                    ]}
                  />
                  <Button type="submit" className="w-fit">
                    Send invite
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
