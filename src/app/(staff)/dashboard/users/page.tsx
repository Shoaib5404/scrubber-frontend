'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { Permission, RequireAuth, hasPermission, useAuthStore } from '@/modules/auth';
import { listUsers, type AdminUser } from '@/modules/users-admin';
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

export default function UsersAdminPage() {
  const actor = useAuthStore((s) => s.user);
  const canManage = hasPermission(actor, Permission.UsersManage);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listUsers(page)
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setLastPage(result.last_page);
        setTotal(result.total);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <RequireAuth staffOnly>
      <AppShell
        title="Users"
        description={`Create and edit Admin, User, and Customer accounts${
          canManage ? '' : ' (view may be limited by permissions)'
        }.`}
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/dashboard/users/new">Create user</Link>
            </Button>
          ) : undefined
        }
        basePath="/dashboard"
      >
        {error ? (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table data-testid="users-admin-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => {
                  const protectedUser = u.role === 'super_admin';
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.is_active
                              ? 'rounded-md border-transparent bg-success/10 text-success'
                              : 'rounded-md'
                          }
                          data-testid={`user-active-${u.id}`}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.plan ?? '—'}</TableCell>
                      <TableCell className="capitalize">{u.subscription_status}</TableCell>
                      <TableCell className="text-right">
                        {protectedUser ? (
                          <span className="text-xs font-medium text-muted-foreground">
                            Protected
                          </span>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="link" size="sm" className="h-auto px-0" asChild>
                              <Link href={`/dashboard/users/${u.id}/edit`}>Edit</Link>
                            </Button>
                            {u.role === 'customer' ? (
                              <Button variant="link" size="sm" className="h-auto px-0" asChild>
                                <Link href={`/dashboard/users/${u.id}/api-clients`}>
                                  API clients
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </RequireAuth>
  );
}
