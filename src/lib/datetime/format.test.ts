import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatAbsoluteDateTime,
  formatSmartDate,
  formatSmartDateTime,
  parseDisplayDate,
} from './format';

/** Local wall-clock constructor — avoids CI timezone flakes. */
function local(
  y: number,
  m: number,
  d: number,
  h = 0,
  min = 0,
  s = 0,
  ms = 0,
): Date {
  return new Date(y, m - 1, d, h, min, s, ms);
}

const NOW = local(2026, 10, 14, 15, 0, 0);

describe('parseDisplayDate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const d = parseDisplayDate('2026-10-14');
    assert.ok(d);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 9);
    assert.equal(d.getDate(), 14);
    assert.equal(d.getHours(), 0);
  });

  it('returns null for invalid input', () => {
    assert.equal(parseDisplayDate('not-a-date'), null);
  });
});

describe('formatSmartDateTime', () => {
  it('returns em dash for null/invalid', () => {
    assert.equal(formatSmartDateTime(null, NOW), '—');
    assert.equal(formatSmartDateTime('bad', NOW), '—');
  });

  it('formats just now and minute buckets', () => {
    assert.equal(
      formatSmartDateTime(local(2026, 10, 14, 14, 59, 30), NOW),
      'Just now',
    );
    assert.equal(
      formatSmartDateTime(local(2026, 10, 14, 14, 59, 0), NOW),
      '1 min ago',
    );
    assert.equal(
      formatSmartDateTime(local(2026, 10, 14, 14, 1, 0), NOW),
      '59 min ago',
    );
  });

  it('formats hour bucket on the same day', () => {
    assert.equal(
      formatSmartDateTime(local(2026, 10, 14, 14, 0, 0), NOW),
      '1h ago',
    );
    assert.equal(
      formatSmartDateTime(local(2026, 10, 14, 10, 0, 0), NOW),
      '5h ago',
    );
  });

  it('uses Yesterday even when wall-clock delta is under 24h', () => {
    const late = local(2026, 10, 13, 23, 50, 0);
    assert.equal(
      formatSmartDateTime(late, NOW),
      'Yesterday, 11:50 pm',
    );
  });

  it('formats same-year absolute day', () => {
    assert.equal(
      formatSmartDateTime(local(2026, 10, 10, 0, 15, 0), NOW),
      '10 Oct, 12:15 am',
    );
  });

  it('includes year for prior years', () => {
    assert.equal(
      formatSmartDateTime(local(2025, 10, 10, 0, 15, 0), NOW),
      '10 Oct 2025, 12:15 am',
    );
  });

  it('formats future as absolute without ago', () => {
    const result = formatSmartDateTime(local(2026, 10, 14, 16, 0, 0), NOW);
    assert.equal(result, '14 Oct, 04:00 pm');
    assert.equal(result.includes('ago'), false);
  });
});

describe('formatSmartDate', () => {
  it('returns Today / Yesterday / month forms', () => {
    assert.equal(formatSmartDate('2026-10-14', NOW), 'Today');
    assert.equal(formatSmartDate('2026-10-13', NOW), 'Yesterday');
    assert.equal(formatSmartDate('2026-10-10', NOW), '10 Oct');
    assert.equal(formatSmartDate('2025-10-10', NOW), '10 Oct 2025');
  });
});

describe('formatAbsoluteDateTime', () => {
  it('includes seconds', () => {
    assert.equal(
      formatAbsoluteDateTime(local(2026, 10, 10, 8, 15, 32)),
      '10 Oct 2026, 08:15:32 am',
    );
  });
});
