'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Permission, hasPermission, useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import { listTenants, type AdminTenant } from '@/modules/tenants-admin';
import { PaginationControls } from '@/components/layout/pagination-controls';
import { TableSkeleton } from '@/components/layout/table-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TenantsAdminPage() {
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.TenantsManage);
  const [rows, setRows] = useState<AdminTenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!canManage) return;
    setLoading(true);
    void listTenants(page)
      .then((data) => {
        setRows(data.data);
        setLastPage(data.last_page);
        setTotal(data.total);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [canManage, page]);

  if (!canManage) {
    return (
      <AppShell title="Tenants" basePath="/dashboard">
        <Alert>
          <AlertDescription>You do not have permission to manage tenants.</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tenants"
      description="Organizations and member invites."
      actions={
        <Button asChild>
          <Link href="/dashboard/tenants/new">New tenant</Link>
        </Button>
      }
      basePath="/dashboard"
    >
      {error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="tabular-nums">Users</TableHead>
                <TableHead className="tabular-nums">Batches</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md capitalize">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{t.subscription_status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(t.features ?? []).length > 0 ? (t.features ?? []).join(', ') : '—'}
                  </TableCell>
                  <TableCell className="tabular-nums">{t.users_count ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">{t.batches_count ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" size="sm" className="h-auto px-0" asChild>
                      <Link href={`/dashboard/tenants/${t.id}`}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={page}
            lastPage={lastPage}
            total={total}
            onPageChange={setPage}
            className="px-3"
          />
        </div>
      )}
    </AppShell>
  );
}
