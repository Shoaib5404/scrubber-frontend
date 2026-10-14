'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  canUploadOrValidate,
  useAuthStore,
} from '@/modules/auth';
import type { BatchSummary } from '@/modules/batches';
import { friendlyError } from '@/modules/batches/components/async-state';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { TableSkeleton } from '@/components/layout/table-skeleton';
import {
  fetchCustomerDashboardStats,
  fetchCustomerRecentBatches,
} from '../api';
import type { CustomerDashboardStats, PeriodFilterValue } from '../types';
import { periodCaption } from '../types';
import { KpiStatGrid } from './kpi-stat-grid';
import { PeriodFilter } from './period-filter';
import { QuickActions } from './quick-actions';
import { RecentBatchesPanel } from './recent-batches-panel';

export function CustomerDashboard() {
  const user = useAuthStore((s) => s.user);
  const canUpload = canUploadOrValidate(user);
  const isTenantAdmin = user?.role === 'tenant_admin';

  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    period: '1m',
  });
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);
  const [recent, setRecent] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextRecent] = await Promise.all([
        fetchCustomerDashboardStats(periodFilter),
        fetchCustomerRecentBatches(10),
      ]);
      setStats(nextStats);
      setRecent(nextRecent);
    } catch (err) {
      setError(friendlyError(err));
      setStats(null);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [periodFilter]);

  useEffect(() => {
    // Data fetch on mount/period change — same pattern as BatchList and admin tables.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote fetch
    void load();
  }, [load]);

  if (loading) {
    return <TableSkeleton rows={6} columns={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  if (!stats) {
    return (
      <EmptyState
        title="No dashboard data"
        description="Company metrics will appear after you upload EDI batches."
      />
    );
  }

  const inFlight =
    stats.batches.pending +
    stats.batches.processing +
    stats.batches.parsed +
    stats.batches.validating;

  const errorBatches = recent.filter((b) =>
    b.status.toLowerCase().includes('error'),
  );

  const actions = [
    { href: '/portal/batches', label: 'View batches' },
    ...(canUpload
      ? [{ href: '/portal/batches', label: 'Upload EDI', variant: 'default' as const }]
      : []),
    ...(isTenantAdmin
      ? [{ href: '/portal/members', label: 'View team' }]
      : []),
    { href: '/portal/upload-logs', label: 'Upload logs' },
  ];

  return (
    <div className="flex flex-col gap-8" data-testid="customer-dashboard">
      <div className="flex w-full flex-wrap items-end justify-between gap-3">
        <div>
          {stats.tenant ? (
            <p className="text-sm text-muted-foreground" data-testid="dashboard-tenant-name">
              {stats.tenant.name}
            </p>
          ) : null}
        </div>
        <PeriodFilter
          id="customer-dashboard-period"
          value={periodFilter}
          onChange={setPeriodFilter}
        />
      </div>

      <KpiStatGrid
        caption={periodCaption(periodFilter)}
        items={[
          { label: 'Batches', value: stats.batches.total, testId: 'kpi-batches' },
          {
            label: 'In progress',
            value: inFlight,
            testId: 'kpi-batches-inflight',
          },
          {
            label: 'Completed',
            value: stats.batches.validated + stats.batches.exported,
            testId: 'kpi-batches-complete',
          },
          {
            label: 'Failed',
            value: stats.batches.error,
            testId: 'kpi-batches-error',
          },
          {
            label: 'Claims',
            value: stats.claims.total,
            testId: 'kpi-claims',
          },
          {
            label: 'Claim errors',
            value: stats.claims.error,
            testId: 'kpi-claim-errors',
          },
          {
            label: 'Claim warnings',
            value: stats.claims.warning,
            testId: 'kpi-claim-warnings',
          },
          {
            label: 'Company users',
            value: stats.users.company_user_count,
            testId: 'kpi-company-users',
          },
        ]}
      />

      {errorBatches.length > 0 ? (
        <section
          aria-labelledby="actionable-issues-heading"
          className="flex flex-col gap-3"
          data-testid="dashboard-actionable-issues"
        >
          <h2
            id="actionable-issues-heading"
            className="text-base font-semibold text-foreground"
          >
            Needs attention
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {errorBatches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/portal/batches/${batch.id}`}
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {batch.original_filename}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Processing failed — open the batch to review errors.
                  </p>
                </div>
                <Link
                  href={`/portal/batches/${batch.id}`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isTenantAdmin ? (
        <section
          aria-labelledby="team-overview-heading"
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="team-overview-heading"
                className="text-base font-semibold text-foreground"
              >
                Team
              </h2>
              <p className="text-sm text-muted-foreground">
                {stats.users.company_user_count} user
                {stats.users.company_user_count === 1 ? '' : 's'} in your organization.
              </p>
            </div>
            <Link
              href="/portal/members"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              View team
            </Link>
          </div>
        </section>
      ) : null}

      <RecentBatchesPanel
        batches={recent}
        basePath="/portal"
        viewAllHref="/portal/batches"
      />

      <QuickActions actions={actions} />
    </div>
  );
}
