'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth, useAuthStore } from '@/modules/auth';
import {
  listAuditCategories,
  setAuditCategoryEnabled,
  type AuditCategoryRow,
} from '@/modules/audit/api';

export default function AuditSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'super_admin';
  const [rows, setRows] = useState<AuditCategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, isSuperAdmin, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    void listAuditCategories()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load categories');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const grouped = useMemo(() => {
    const map = new Map<string, AuditCategoryRow[]>();
    for (const row of rows) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [rows]);

  async function onToggle(code: string, enabled: boolean) {
    setSaving(code);
    setRows((prev) =>
      prev.map((r) => (r.code === code ? { ...r, enabled } : r)),
    );
    try {
      const updated = await setAuditCategoryEnabled(code, enabled);
      setRows((prev) => prev.map((r) => (r.code === code ? updated : r)));
      setError(null);
    } catch (e: unknown) {
      setRows((prev) =>
        prev.map((r) => (r.code === code ? { ...r, enabled: !enabled } : r)),
      );
      setError(e instanceof Error ? e.message : 'Failed to update category');
    } finally {
      setSaving(null);
    }
  }

  return (
    <RequireAuth staffOnly>
      <AppShell title="Audit settings" basePath="/dashboard">
        {!isSuperAdmin ? (
          <p className="text-sm text-muted-foreground">Redirecting…</p>
        ) : (
          <>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Disable any category to stop new events immediately. Existing events are kept.
              No redeploy or environment variables required.
            </p>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <div className="mt-6 space-y-8" data-testid="audit-settings">
              {grouped.map(([group, items]) => (
                <section key={group}>
                  <h2 className="text-base font-semibold">{group}</h2>
                  <ul className="mt-3 divide-y divide-border rounded-md border border-border">
                    {items.map((item) => (
                      <li
                        key={item.code}
                        className="flex items-start justify-between gap-4 px-4 py-3"
                      >
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.code}</div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            disabled={saving === item.code}
                            onChange={(e) => void onToggle(item.code, e.target.checked)}
                            data-testid={`audit-toggle-${item.code}`}
                          />
                          {item.enabled ? 'On' : 'Off'}
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </AppShell>
    </RequireAuth>
  );
}
