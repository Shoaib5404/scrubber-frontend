'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import {
  getPermissionsMatrix,
  updatePermissionsMatrix,
  type PermissionMeta,
  type PermissionsMatrixData,
} from '../permissions-api';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  user: 'User',
};

export function PermissionsMatrix() {
  const [data, setData] = useState<PermissionsMatrixData | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getPermissionsMatrix()
      .then((matrix) => {
        if (cancelled) {
          return;
        }
        setData(matrix);
        setSelected(matrix.selected);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.title ?? err.message
              : 'Failed to load permissions.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(role: string, permission: string) {
    setSelected((prev) => {
      const current = new Set(prev[role] ?? []);
      if (current.has(permission)) {
        current.delete(permission);
      } else {
        current.add(permission);
      }
      return { ...prev, [role]: [...current] };
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await updatePermissionsMatrix(selected);
      setSelected(result.selected);
      setMessage('Permissions updated successfully.');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.title ?? err.message
          : 'Failed to save permissions.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading permissions…</p>;
  }

  if (!data) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error ?? 'Unable to load permissions.'}
      </p>
    );
  }

  const groups = Object.entries(data.grouped);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm text-slate-600">
        Configure which permissions Admin and User roles receive. Super Admin always has full
        access. Customers have no staff permissions.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <th className="px-4 py-3 font-medium">Permission</th>
              {data.roles.map((role) => (
                <th key={role} className="px-4 py-3 font-medium">
                  {ROLE_LABELS[role] ?? role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([group, perms]) => (
              <GroupRows
                key={group}
                group={group}
                perms={perms}
                roles={data.roles}
                selected={selected}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save permissions'}
      </button>
    </form>
  );
}

function GroupRows({
  group,
  perms,
  roles,
  selected,
  onToggle,
}: {
  group: string;
  perms: PermissionMeta[];
  roles: string[];
  selected: Record<string, string[]>;
  onToggle: (role: string, permission: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-slate-100 bg-slate-50/80">
        <td colSpan={1 + roles.length} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {group}
        </td>
      </tr>
      {perms.map((perm) => (
        <tr key={perm.value} className="border-b border-slate-100">
          <td className="px-4 py-3">
            <div className="font-medium text-slate-900">{perm.label}</div>
            <div className="text-xs text-slate-500">{perm.description}</div>
          </td>
          {roles.map((role) => {
            const checked = (selected[role] ?? []).includes(perm.value);
            const id = `${role}-${perm.value}`;
            return (
              <td key={role} className="px-4 py-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(role, perm.value)}
                  className="h-4 w-4 rounded border-slate-300"
                  aria-label={`${ROLE_LABELS[role] ?? role}: ${perm.label}`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
