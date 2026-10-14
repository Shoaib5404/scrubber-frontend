'use client';

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
import { SmartTime } from '@/components/ui/smart-time';
import type { MemberActivity } from '../types';

type MemberActivityTableProps = {
  members: MemberActivity[];
  onResendInvite?: (email: string) => void;
};

export function MemberActivityTable({
  members,
  onResendInvite,
}: MemberActivityTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-border bg-card"
      data-testid="member-activity-table"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Batches</TableHead>
            <TableHead className="text-right">Batch errors</TableHead>
            <TableHead className="text-right">Claims</TableHead>
            <TableHead className="text-right">Claim errors</TableHead>
            <TableHead>Last upload</TableHead>
            {onResendInvite ? <TableHead /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id} data-testid={`member-row-${m.id}`}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell className="capitalize">{m.role.replace('_', ' ')}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    m.is_active
                      ? 'rounded-md border-transparent bg-success/10 text-success'
                      : 'rounded-md'
                  }
                >
                  {m.is_active
                    ? 'Active'
                    : m.invite_pending
                      ? 'Invite pending'
                      : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {m.batches_uploaded}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {m.batches_error}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {m.claims_total}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {m.claims_error}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <SmartTime value={m.last_upload_at} />
              </TableCell>
              {onResendInvite ? (
                <TableCell className="text-right">
                  {!m.is_active ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={() => onResendInvite(m.email)}
                    >
                      Resend
                    </Button>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
