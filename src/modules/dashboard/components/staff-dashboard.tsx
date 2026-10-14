'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Permission,
  hasPermission,
  useAuthStore,
} from '@/modules/auth';
import { friendlyError } from '@/modules/batches/components/async-state';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { TableSkeleton } from '@/components/layout/table-skeleton';
import {
  fetchStaffDashboardActivity,
  fetchStaffDashboardStats,
} from '../api';
import type {
  PeriodFilterValue,
  StaffDashboardActivity,
  StaffDashboardStats,
} from '../types';
import { periodCaption } from '../types';
import { KpiStatGrid } from './kpi-stat-grid';
import { PeriodFilter } from './period-filter';
import { QuickActions } from './quick-actions';
import { SmartTime } from '@/components/ui/smart-time';
import { RecentBatchesPanel } from './recent-batches-panel';

export function StaffDashboard() {
  const user = useAuthStore((s) => s.user);
  const canView = hasPermission(user, Permission.DashboardView);
  const canManageTenants = hasPermission(user, Permission.TenantsManage);
  const canManageUsers = hasPermission(user, Permission.UsersManage);
  const canViewAudit = hasPermission(user, Permission.AuditView);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    period: '1m',
  });
  const [stats, setStats] = useState<StaffDashboardStats | null>(null);
  const [activity, setActivity] = useState<StaffDashboardActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError('You do not have permission to view the dashboard.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextActivity] = await Promise.all([
        fetchStaffDashboardStats(periodFilter),
        fetchStaffDashboardActivity(10),
      ]);
      setStats(nextStats);
      setActivity(nextActivity);
    } catch (err) {
      setError(friendlyError(err));
      setStats(null);
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [canView, periodFilter]);

  useEffect(() => {
    // Data fetch on mount/period change — same pattern as BatchList and admin tables.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote fetch
    void load();
  }, [load]);

  if (!canView) {
    return (
      <ErrorState
        message="You do not have permission to view the dashboard."
      />
    );
  }

  if (loading) {
    return <TableSkeleton rows={6} columns={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  if (!stats || !activity) {
    return (
      <EmptyState
        title="No dashboard data"
        description="Platform metrics will appear once tenants and batches exist."
      />
    );
  }

  const inFlight =
    stats.batches.pending +
    stats.batches.processing +
    stats.batches.parsed +
    stats.batches.validating;

  const actions = [
    { href: '/dashboard/batches', label: 'View batches' },
    { href: '/dashboard/batches?status=error', label: 'Failed batches' },
    { href: '/dashboard/upload-logs', label: 'Upload logs' },
    ...(canViewAudit
      ? [{ href: '/dashboard/audit-logs', label: 'Audit logs' }]
      : []),
    ...(canManageTenants
      ? [{ href: '/dashboard/tenants', label: 'Manage tenants' }]
      : []),
    ...(canManageUsers
      ? [{ href: '/dashboard/users', label: 'Manage users' }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8" data-testid="staff-dashboard">
      <div className="flex w-full flex-wrap items-end justify-end gap-3">
        <PeriodFilter
          id="staff-dashboard-period"
          value={periodFilter}
          onChange={setPeriodFilter}
        />
      </div>

      <KpiStatGrid
        caption={periodCaption(periodFilter)}
        items={[
          { label: 'Tenants', value: stats.tenants.total, testId: 'kpi-tenants' },
          {
            label: 'Active tenants',
            value: stats.tenants.active,
            testId: 'kpi-tenants-active',
          },
          {
            label: 'Batches',
            value: stats.batches.total,
            testId: 'kpi-batches',
          },
          {
            label: 'Failed batches',
            value: stats.batches.error,
            testId: 'kpi-batches-error',
          },
          {
            label: 'In progress',
            value: inFlight,
            testId: 'kpi-batches-inflight',
          },
          {
            label: 'Claims processed',
            value: stats.claims.total,
            testId: 'kpi-claims',
          },
          {
            label: 'Staff users',
            value: stats.users.total_staff,
            testId: 'kpi-staff-users',
          },
          {
            label: 'Tenant users',
            value: stats.users.total_tenant_users,
            testId: 'kpi-tenant-users',
          },
        ]}
      />

      {canManageTenants ? (
        <section aria-labelledby="tenant-snapshot-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="tenant-snapshot-heading"
              className="text-base font-semibold text-foreground"
            >
              Tenant snapshot
            </h2>
            <Link
              href="/dashboard/tenants"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Manage tenants
            </Link>
          </div>
          {activity.recent_tenants.length === 0 ? (
            <EmptyState
              title="No tenants yet"
              description="Create a tenant to onboard a customer organization."
            />
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {activity.recent_tenants.map((tenant) => (
                <li
                  key={tenant.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div>
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {tenant.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {tenant.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="processing-health-heading" className="flex flex-col gap-3">
        <h2
          id="processing-health-heading"
          className="text-base font-semibold text-foreground"
        >
          Processing health
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">In progress</p>
            <p className="text-xl font-semibold tabular-nums">{inFlight}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Validated / exported</p>
            <p className="text-xl font-semibold tabular-nums">
              {stats.batches.validated + stats.batches.exported}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-xl font-semibold tabular-nums text-destructive">
              {stats.batches.error}
            </p>
            {stats.batches.error > 0 ? (
              <Link
                href="/dashboard/batches?status=error"
                className="mt-2 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Investigate failed batches
              </Link>
            ) : null}
          </div>
        </div>
        {activity.recent_upload_errors.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Recent upload errors</p>
              <Link
                href="/dashboard/upload-logs"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                View logs
              </Link>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {activity.recent_upload_errors.slice(0, 5).map((row) => (
                <li key={row.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {row.original_filename ?? 'Upload'}
                    {row.tenant_name ? ` · ${row.tenant_name}` : ''}
                  </span>
                  <SmartTime
                    value={row.created_at}
                    className="tabular-nums"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <RecentBatchesPanel
        batches={activity.recent_batches}
        basePath="/dashboard"
        showTenant
        viewAllHref="/dashboard/batches"
      />

      <QuickActions actions={actions} />
    </div>
  );
}
