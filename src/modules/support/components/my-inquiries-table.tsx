'use client';

import Link from 'next/link';
import { Fragment, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartTime } from '@/components/ui/smart-time';
import { cn } from '@/lib/utils';
import type { InquiryTicket } from '../api';

type Props = {
  rows: InquiryTicket[];
};

export function MyInquiriesTable({ rows }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="my-inquiries-empty">
        You have not submitted any inquiries yet.
      </p>
    );
  }

  function toggleExpand(id: number) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table
        className="w-full min-w-[560px] text-left text-sm"
        data-testid="my-inquiries-table"
      >
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-2 py-2 font-medium sm:px-3">Reference</th>
            <th className="px-2 py-2 font-medium sm:px-3">Subject</th>
            <th className="hidden px-2 py-2 font-medium sm:table-cell sm:px-3">
              Status
            </th>
            <th className="px-2 py-2 font-medium sm:px-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const open = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <tr
                  className="border-b border-border last:border-0"
                  data-testid={`my-inquiry-row-${row.id}`}
                >
                  <td className="px-2 py-2 sm:px-3">
                    <button
                      type="button"
                      className="inline-flex max-w-full items-center gap-1 font-medium text-primary hover:underline"
                      aria-expanded={open}
                      onClick={() => toggleExpand(row.id)}
                      data-testid={`my-inquiry-expand-${row.id}`}
                    >
                      <ChevronRightIcon
                        className={cn(
                          'size-3.5 shrink-0 transition-transform',
                          open && 'rotate-90',
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{row.public_reference}</span>
                    </button>
                  </td>
                  <td className="max-w-[140px] truncate px-2 py-2 sm:max-w-[180px] sm:px-3">
                    {row.subject}
                  </td>
                  <td className="hidden px-2 py-2 capitalize sm:table-cell sm:px-3">
                    {row.status.replace(/_/g, ' ')}
                  </td>
                  <td className="px-2 py-2 sm:px-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/portal/support/${row.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
                {open ? (
                  <tr
                    className="border-b border-border bg-muted/30"
                    data-testid={`my-inquiry-preview-${row.id}`}
                  >
                    <td colSpan={4} className="px-3 py-3 sm:px-4">
                      <dl className="grid gap-2 text-xs sm:grid-cols-2 sm:text-sm">
                        <div>
                          <dt className="text-muted-foreground">Category</dt>
                          <dd className="font-medium">{row.category_label}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Status</dt>
                          <dd className="capitalize font-medium">
                            {row.status.replace(/_/g, ' ')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Updated</dt>
                          <dd>
                            <SmartTime value={row.updated_at} display="absolute" />
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-muted-foreground">Message</dt>
                          <dd className="mt-0.5 line-clamp-4 whitespace-pre-wrap">
                            {row.description}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Use <span className="font-medium">View</span> for the
                        full conversation and to reply.
                      </p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
