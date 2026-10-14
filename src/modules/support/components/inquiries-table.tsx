'use client';

import Link from 'next/link';
import { SmartTime } from '@/components/ui/smart-time';
import type { InquiryTicket } from '../api';

type Props = {
  rows: InquiryTicket[];
};

export function InquiriesTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground" data-testid="inquiries-empty">
        No inquiries found.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-sm" data-testid="inquiries-table">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Reference</th>
            <th className="px-3 py-2 font-medium">Subject</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Requester</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2">
                <Link
                  href={`/dashboard/inquiries/${row.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {row.public_reference}
                </Link>
                {row.has_attachment ? (
                  <span className="ml-2 text-xs text-muted-foreground">file</span>
                ) : null}
              </td>
              <td className="max-w-[220px] truncate px-3 py-2">{row.subject}</td>
              <td className="px-3 py-2">{row.category_label}</td>
              <td className="px-3 py-2">
                <div className="truncate">{row.requester_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.requester_email}
                </div>
              </td>
              <td className="px-3 py-2 capitalize">{row.status.replace(/_/g, ' ')}</td>
              <td className="px-3 py-2 text-muted-foreground">
                <SmartTime value={row.created_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
