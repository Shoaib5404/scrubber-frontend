'use client';

import { useEffect, useState } from 'react';
import { cn } from 'cn';
import {
  formatAbsoluteDateTime,
  formatSmartDate,
  formatSmartDateTime,
  parseDisplayDate,
} from '@/lib/datetime/format';

export type SmartTimeProps = {
  value: string | Date | null | undefined;
  mode?: 'datetime' | 'date';
  empty?: string;
  className?: string;
  /** Live tick interval; default 60_000 when datetime age < 24h, else 0. */
  refreshMs?: number;
};

function resolveRefreshMs(
  value: string | Date | null | undefined,
  mode: 'datetime' | 'date',
  explicit: number | undefined,
  now: Date,
): number {
  if (explicit !== undefined) return explicit;
  if (mode !== 'datetime') return 0;
  const date = value == null || value === '' ? null : parseDisplayDate(value);
  if (!date) return 0;
  const age = now.getTime() - date.getTime();
  if (age < 0 || age >= 24 * 60 * 60_000) return 0;
  return 60_000;
}

function toDateTimeAttr(value: string | Date | null | undefined): string | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  const parsed = parseDisplayDate(value);
  return parsed ? parsed.toISOString() : undefined;
}

export function SmartTime({
  value,
  mode = 'datetime',
  empty = '—',
  className,
  refreshMs,
}: SmartTimeProps) {
  const [now, setNow] = useState(() => new Date());

  const intervalMs = resolveRefreshMs(value, mode, refreshMs, now);

  useEffect(() => {
    if (intervalMs <= 0) return;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  if (value == null || value === '') {
    return <span className={className}>{empty}</span>;
  }

  const parsed = parseDisplayDate(value);
  if (!parsed) {
    return <span className={className}>{empty}</span>;
  }

  const label =
    mode === 'date'
      ? formatSmartDate(value, now)
      : formatSmartDateTime(value, now);

  if (label === '—') {
    return <span className={className}>{empty}</span>;
  }

  const absolute = formatAbsoluteDateTime(value);

  return (
    <time
      dateTime={toDateTimeAttr(value)}
      title={absolute === '—' ? undefined : absolute}
      className={cn(className)}
    >
      {label}
    </time>
  );
}
