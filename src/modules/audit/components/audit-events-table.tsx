'use client';

import { SmartTime } from '@/components/ui/smart-time';
import type { AuditEventRow } from '../api';

type Props = {
  rows: AuditEventRow[];
  showTenant?: boolean;
};

export function AuditEventsTable({ rows, showTenant = false }: Props) {
  return (
    <table className="mt-4 w-full text-left text-sm" data-testid="audit-events-table">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          <th className="py-2 pr-3">When</th>
          <th className="py-2 pr-3">Category</th>
          <th className="py-2 pr-3">Action</th>
          <th className="py-2 pr-3">Actor</th>
          {showTenant ? <th className="py-2 pr-3">Tenant</th> : null}
          <th className="py-2">Resource</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={showTenant ? 6 : 5}
              className="py-6 text-muted-foreground"
            >
              No audit events found.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.id} className="border-b border-border align-top">
              <td className="py-2 pr-3 whitespace-nowrap">
                <SmartTime value={r.occurred_at} mode="datetime" display="absolute" />
              </td>
              <td className="py-2 pr-3">
                <div>{r.category_label}</div>
                <div className="text-xs text-muted-foreground">{r.category_code}</div>
              </td>
              <td className="py-2 pr-3">{r.action}</td>
              <td className="py-2 pr-3">
                {r.actor_user?.email ??
                  (r.actor_user_id != null ? `User #${r.actor_user_id}` : r.actor_type)}
                {r.actor_role ? (
                  <div className="text-xs text-muted-foreground">{r.actor_role}</div>
                ) : null}
              </td>
              {showTenant ? (
                <td className="py-2 pr-3">
                  {r.tenant?.name ?? (r.tenant_id != null ? `#${r.tenant_id}` : '—')}
                </td>
              ) : null}
              <td className="py-2">
                {r.resource_type
                  ? `${r.resource_type}${r.resource_id ? ` #${r.resource_id}` : ''}`
                  : '—'}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
