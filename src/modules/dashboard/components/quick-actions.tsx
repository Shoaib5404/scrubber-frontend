'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export type QuickAction = {
  href: string;
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
};

type QuickActionsProps = {
  actions: QuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  if (actions.length === 0) return null;
  return (
    <section aria-labelledby="quick-actions-heading" className="flex flex-col gap-3">
      <h2 id="quick-actions-heading" className="text-base font-semibold text-foreground">
        Quick actions
      </h2>
      <div className="flex flex-wrap gap-2" data-testid="dashboard-quick-actions">
        {actions.map((action) => (
          <Button
            key={`${action.href}:${action.label}`}
            asChild
            variant={action.variant ?? 'outline'}
            size="sm"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
