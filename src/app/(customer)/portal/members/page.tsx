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
        <p className="text-sm text-slate-600">Only tenant admins can manage members.</p>
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
    <AppShell title="Members" basePath="/portal">
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="mb-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-slate-100">
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.role}</td>
                <td className="px-4 py-3">{m.is_active ? 'Active' : 'Pending / inactive'}</td>
                <td className="px-4 py-3 text-right">
                  {!m.is_active ? (
                    <button
                      type="button"
                      className="text-sm font-medium underline"
                      onClick={() =>
                        void resendMyTenantInvite(m.email)
                          .then(() => setMessage(`Invite resent to ${m.email}`))
                          .catch((err: Error) => setError(err.message))
                      }
                    >
                      Resend
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={onInvite} className="max-w-lg space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Invite member</h2>
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="customer">Customer</option>
          <option value="tenant_admin">Tenant admin</option>
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Send invite
        </button>
      </form>
    </AppShell>
  );
}
