'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { ApiClientError } from '@/lib/api/errors';
import {
  getPermissionsMatrix,
  updatePermissionsMatrix,
  type PermissionMeta,
  type PermissionsMatrixData,
} from '../permissions-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? 'Unable to load permissions.'}</AlertDescription>
      </Alert>
    );
  }

  const groups = Object.entries(data.grouped);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Configure which permissions Admin and User roles receive. Super Admin always has full
        access. Customers have no staff permissions.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table className="min-w-[36rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              {data.roles.map((role) => (
                <TableHead key={role}>{ROLE_LABELS[role] ?? role}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
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
          </TableBody>
        </Table>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
              Saving…
            </>
          ) : (
            'Save permissions'
          )}
        </Button>
      </div>
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
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell
          colSpan={1 + roles.length}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {group}
        </TableCell>
      </TableRow>
      {perms.map((perm) => (
        <TableRow key={perm.value}>
          <TableCell>
            <div className="font-medium text-foreground">{perm.label}</div>
            <div className="text-xs text-muted-foreground">{perm.description}</div>
          </TableCell>
          {roles.map((role) => {
            const checked = (selected[role] ?? []).includes(perm.value);
            const id = `${role}-${perm.value}`;
            return (
              <TableCell key={role}>
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(role, perm.value)}
                  className="size-4 rounded border-border"
                  aria-label={`${ROLE_LABELS[role] ?? role}: ${perm.label}`}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
