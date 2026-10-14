'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type KpiItem = {
  label: string;
  value: number | string;
  testId?: string;
};

type KpiStatGridProps = {
  items: KpiItem[];
  caption?: string;
};

export function KpiStatGrid({ items, caption }: KpiStatGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {caption ? (
        <p className="text-xs text-muted-foreground" data-testid="dashboard-period-label">
          {caption}
        </p>
      ) : null}
      <dl
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        data-testid="dashboard-kpi-grid"
      >
        {items.map((item) => (
          <Card key={item.label} size="sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dd
                className="text-2xl font-semibold tabular-nums text-foreground"
                data-testid={item.testId}
              >
                {item.value}
              </dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  );
}
