const EMPTY = '—';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Parse ISO / Date / YYYY-MM-DD (local calendar) for display. */
export function parseDisplayDate(input: string | Date): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const raw = input.trim();
  if (!raw) return null;
  if (DATE_ONLY.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    const local = new Date(y, m - 1, d, 0, 0, 0, 0);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(target: Date, now: Date): boolean {
  const yesterday = startOfLocalDay(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameLocalDay(target, yesterday);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 12-hour clock with lowercase am/pm, e.g. `08:15 pm`. */
function formatClock(d: Date, withSeconds = false): string {
  let hours = d.getHours();
  const minutes = pad2(d.getMinutes());
  const seconds = pad2(d.getSeconds());
  const suffix = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const h = pad2(hours);
  return withSeconds ? `${h}:${minutes}:${seconds} ${suffix}` : `${h}:${minutes} ${suffix}`;
}

function formatDayMonth(d: Date, includeYear: boolean): string {
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  if (includeYear) return `${day} ${month} ${d.getFullYear()}`;
  return `${day} ${month}`;
}

function formatCalendarDateTime(d: Date, now: Date): string {
  const includeYear = d.getFullYear() !== now.getFullYear();
  return `${formatDayMonth(d, includeYear)}, ${formatClock(d)}`;
}

/**
 * Smart datetime for lists/dashboards.
 * Buckets: Just now → N min ago → Nh ago → Today → Yesterday → D MMM → D MMM YYYY.
 */
export function formatSmartDateTime(
  input: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (input == null || input === '') return EMPTY;
  const date = parseDisplayDate(input);
  if (!date) return EMPTY;

  const ms = now.getTime() - date.getTime();

  if (ms < 0) {
    return formatCalendarDateTime(date, now);
  }

  if (isSameLocalDay(date, now)) {
    if (ms < 45_000) return 'Just now';
    if (ms < 60 * 60_000) {
      const mins = Math.max(1, Math.floor(ms / 60_000));
      return `${mins} min ago`;
    }
    if (ms < 24 * 60 * 60_000) {
      const hours = Math.max(1, Math.floor(ms / 3_600_000));
      return `${hours}h ago`;
    }
    return `Today, ${formatClock(date)}`;
  }

  if (isYesterday(date, now)) {
    return `Yesterday, ${formatClock(date)}`;
  }

  return formatCalendarDateTime(date, now);
}

/** Smart calendar date (no clock). */
export function formatSmartDate(
  input: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (input == null || input === '') return EMPTY;
  const date = parseDisplayDate(input);
  if (!date) return EMPTY;

  if (isSameLocalDay(date, now)) return 'Today';
  if (isYesterday(date, now)) return 'Yesterday';
  const includeYear = date.getFullYear() !== now.getFullYear();
  return formatDayMonth(date, includeYear);
}

/** Absolute tooltip string including seconds. */
export function formatAbsoluteDateTime(
  input: string | Date | null | undefined,
): string {
  if (input == null || input === '') return EMPTY;
  const date = parseDisplayDate(input);
  if (!date) return EMPTY;
  const includeYear = true;
  return `${formatDayMonth(date, includeYear)}, ${formatClock(date, true)}`;
}
