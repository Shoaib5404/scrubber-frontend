'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '@/modules/auth';
import { AppShell } from '@/modules/batches';
import {
  inviteMyTenantMember,
  listMyTenantMembers,
  resendMyTenantInvite,
  type TenantMemberRow,
} from '@/modules/tenant-members/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PortalMembersPage() {
  const user = useAuthStore((s) => s.user);
  const isTenantAdmin = user?.role === 'tenant_admin';
  const [rows, setRows] = useState<TenantMemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');

  async function reload() {
    setRows(await listMyTenantMembers());
  }

  useEffect(() => {
    if (!isTenantAdmin) return;
    void reload().catch((err: Error) => setError(err.message));
  }, [isTenantAdmin]);

  if (!isTenantAdmin) {
    return (
      <AppShell title="Members" basePath="/portal">
        <Alert>
          <AlertDescription>Only tenant admins can manage members.</AlertDescription>
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

  return (
    <AppShell title="Members" description="Invite and manage organization members." basePath="/portal">
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

      <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell className="capitalize">{m.role}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      m.is_active
                        ? 'rounded-md border-transparent bg-success/10 text-success'
                        : 'rounded-md'
                    }
                  >
                    {m.is_active ? 'Active' : 'Pending / inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!m.is_active ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={() =>
                        void resendMyTenantInvite(m.email)
                          .then(() => setMessage(`Invite resent to ${m.email}`))
                          .catch((err: Error) => setError(err.message))
                      }
                    >
                      Resend
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="member-role">Role</Label>
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="customer">Customer</option>
                <option value="tenant_admin">Tenant admin</option>
              </select>
            </div>
            <Button type="submit" className="w-fit">
              Send invite
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
