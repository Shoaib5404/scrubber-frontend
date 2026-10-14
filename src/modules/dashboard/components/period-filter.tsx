'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PERIOD_OPTIONS,
  defaultCustomRange,
  isDashboardPeriod,
  type DashboardPeriod,
  type PeriodFilterValue,
} from '../types';

type PeriodFilterProps = {
  id: string;
  value: PeriodFilterValue;
  onChange: (next: PeriodFilterValue) => void;
  /** Wider trigger for longer labels */
  className?: string;
};

export function PeriodFilter({
  id,
  value,
  onChange,
  className,
}: PeriodFilterProps) {
  const draftDefaults = defaultCustomRange();
  const [draftFrom, setDraftFrom] = useState(value.from ?? draftDefaults.from);
  const [draftTo, setDraftTo] = useState(value.to ?? draftDefaults.to);

  const selectValue: DashboardPeriod =
    value.period === '30d' ? '1m' : value.period;

  const applyCustom = () => {
    if (!draftFrom || !draftTo) return;
    if (draftFrom > draftTo) return;
    onChange({ period: 'custom', from: draftFrom, to: draftTo });
  };

  return (
    <div
      className="ml-auto flex flex-wrap items-end justify-end gap-2"
      data-testid="period-filter"
    >
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-muted-foreground">
          Period
        </Label>
        <Select
          value={selectValue}
          onValueChange={(next) => {
            if (!isDashboardPeriod(next)) return;
            if (next === 'custom') {
              const range = defaultCustomRange();
              setDraftFrom(value.from ?? range.from);
              setDraftTo(value.to ?? range.to);
              onChange({
                period: 'custom',
                from: value.from ?? range.from,
                to: value.to ?? range.to,
              });
              return;
            }
            onChange({ period: next });
          }}
        >
          <SelectTrigger
            id={id}
            className={className ?? 'w-[170px]'}
            data-testid="dashboard-period-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectValue === 'custom' ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-from`} className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id={`${id}-from`}
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="w-[150px]"
              data-testid="period-from"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-to`} className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id={`${id}-to`}
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="w-[150px]"
              data-testid="period-to"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={applyCustom}
            disabled={!draftFrom || !draftTo || draftFrom > draftTo}
            data-testid="period-apply"
          >
            Apply
          </Button>
        </div>
      ) : null}
    </div>
  );
}
