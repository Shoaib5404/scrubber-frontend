'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import { friendlyError } from '@/modules/batches/components/async-state';
import { KpiStatGrid, PeriodFilter, periodCaption } from '@/modules/dashboard';
import {
  inviteMyTenantMember,
  resendMyTenantInvite,
} from '@/modules/tenant-members/api';
import { fetchTenantSelfOverview } from '@/modules/tenant-members/overview-api';
import {
  MemberActivityTable,
  type PeriodFilterValue,
  type TenantOverview,
} from '@/modules/team';
import { AppSelect } from '@/components/forms';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableSkeleton } from '@/components/layout/table-skeleton';

export default function PortalMembersPage() {
  const user = useAuthStore((s) => s.user);
  const isTenantAdmin = user?.role === 'tenant_admin';
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    period: '1m',
  });
  const [overview, setOverview] = useState<TenantOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');

  const reload = useCallback(async () => {
    if (!isTenantAdmin) return;
    setLoading(true);
    setError(null);
    try {
      setOverview(await fetchTenantSelfOverview(periodFilter));
    } catch (err) {
      setError(friendlyError(err));
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [isTenantAdmin, periodFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote fetch
    void reload();
  }, [reload]);

  if (!isTenantAdmin) {
    return (
      <AppShell title="Team" basePath="/portal">
        <Alert>
          <AlertDescription>Only tenant admins can manage the team.</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await inviteMyTenantMember({
        email: email.trim(),
        name: name.trim() || email.trim(),
        role,
      });
      setEmail('');
      setName('');
      setMessage('Invite sent.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
  }

  const stats = overview?.stats;
  const inFlight = stats
    ? stats.batches.pending +
      stats.batches.processing +
      stats.batches.parsed +
      stats.batches.validating
    : 0;
  return (
    <AppShell
      title="Team"
      description="Organization members and activity for your company."
      basePath="/portal"
    >
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

      {!loading && overview && stats ? (
        <div className="flex flex-col gap-8" data-testid="team-overview">
          <div className="flex w-full flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground" data-testid="team-org-name">
                {overview.tenant.name}
              </p>
              {overview.tenant.subscription_status ? (
                <p className="text-xs text-muted-foreground capitalize">
                  Subscription: {overview.tenant.subscription_status.replace(/_/g, ' ')}
                </p>
              ) : null}
            </div>
            <PeriodFilter
              id="team-period"
              value={periodFilter}
              onChange={setPeriodFilter}
            />
          </div>

          <KpiStatGrid
            caption={periodCaption(periodFilter)}
            items={[
              { label: 'Batches', value: stats.batches.total, testId: 'team-kpi-batches' },
              { label: 'In progress', value: inFlight },
              { label: 'Failed', value: stats.batches.error },
              { label: 'Claims', value: stats.claims.total },
              {
                label: 'Company users',
                value: stats.users.company_user_count,
                testId: 'team-kpi-users',
              },
            ]}
          />

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">Member activity</h2>
            <MemberActivityTable
              members={overview.members}
              onResendInvite={(memberEmail) =>
                void resendMyTenantInvite(memberEmail)
                  .then(() => setMessage(`Invite resent to ${memberEmail}`))
                  .catch((err: Error) => setError(err.message))
              }
            />
          </section>

          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Invite member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onInvite} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="member-name">Name</Label>
                  <Input
                    id="member-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <AppSelect
                  id="member-role"
                  label="Role"
                  value={role}
                  size="sm"
                  onValueChange={setRole}
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
      ) : null}
    </AppShell>
  );
}
