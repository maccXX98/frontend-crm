import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/format';

describe('formatDate', () => {
  it('should return empty string for undefined or falsy values', () => {
    expect(formatDate(undefined)).toBe('');
    // @ts-expect-error testing invalid type input
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('should format valid Date object, string, or number correctly', () => {
    const dateObj = new Date('2026-06-18T12:00:00.000Z');
    const formatted = formatDate(dateObj);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('18');

    expect(formatDate('2026-06-18T12:00:00.000Z')).toContain('2026');
    expect(formatDate(dateObj.getTime())).toContain('2026');
  });

  it('should respect custom formatting options', () => {
    const dateObj = new Date('2026-06-18T12:00:00.000Z');
    const customOpts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    const formatted = formatDate(dateObj, customOpts);
    expect(formatted).toContain('Jun');
    expect(formatted).toContain('2026');
  });

  it('should return empty string on invalid date inputs', () => {
    expect(formatDate('invalid-date')).toBe('');
  });

  // --- New tests below ---

  it('should format month as long (default) to produce "June"', () => {
    // Use noon UTC to avoid timezone day-shift
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)));
    // Default month is 'long' → 'June'
    expect(result).toMatch(/June/);
  });

  it('should format day as numeric (default) to produce "18"', () => {
    // Use noon UTC to avoid timezone day-shift
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)));
    // Default day is 'numeric' → '18'
    expect(result).toMatch(/18/);
  });

  it('should format year as numeric (default) to produce "2026"', () => {
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)));
    // Default year is 'numeric' → '2026'
    expect(result).toMatch(/2026/);
  });

  it('should accept month: short to produce "Jun"', () => {
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)), { month: 'short' });
    expect(result).toMatch(/Jun/);
  });

  it('should accept year: 2-digit to produce "26"', () => {
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)), { year: '2-digit' });
    expect(result).toMatch(/26/);
  });

  it('should accept weekday: long to produce "Thursday"', () => {
    // June 18, 2026 is a Thursday in UTC
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)), { weekday: 'long' });
    expect(result).toMatch(/Thursday/);
  });

  it('should allow multiple custom opts to override defaults', () => {
    const result = formatDate(new Date(Date.UTC(2026, 5, 18, 12, 0, 0)), {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    // Should produce "Jun 18, 2026"
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/18/);
    expect(result).toMatch(/2026/);
  });

  it('should handle Date object input the same as string input', () => {
    const d = new Date(Date.UTC(2026, 5, 18, 12, 0, 0));
    const fromString = formatDate('2026-06-18T12:00:00.000Z');
    const fromDate = formatDate(d);
    expect(fromString).toEqual(fromDate);
  });

  it('should handle Date object representing Unix epoch (local TZ display)', () => {
    // new Date(0) = Unix epoch. Intl.DateTimeFormat uses local timezone,
    // so in UTC-5 (CDT) this shows as "December 31, 1969"
    const epochDate = new Date(0);
    const result = formatDate(epochDate);
    // Verify it formats something (the function is working correctly — it uses local TZ)
    expect(result).toBeTruthy();
    expect(result).toMatch(/1969|1970/);
  });

  it('should return empty string for invalid date string "not a date"', () => {
    expect(formatDate('not a date')).toBe('');
  });

  it('should handle far future date and include year 2099', () => {
    // Use noon UTC to avoid timezone day-shift on year boundary
    const result = formatDate(new Date(Date.UTC(2099, 11, 31, 12, 0, 0)));
    expect(result).toMatch(/2099/);
    expect(result).toMatch(/31/);
  });

  it('should handle 0 (falsy number) and return empty string', () => {
    // 0 is falsy — the guard `if (!date)` catches it
    expect(formatDate(0)).toBe('');
  });

  it('should return empty string when date is Number.NaN', () => {
    expect(formatDate(Number.NaN)).toBe('');
  });

  it('should handle timestamp via Date object (not falsy 0) correctly', () => {
    // Date.UTC(2026,5,18) returns a non-zero timestamp
    const ts = Date.UTC(2026, 5, 18, 12, 0, 0);
    const result = formatDate(new Date(ts));
    expect(result).toMatch(/June/);
    expect(result).toMatch(/2026/);
  });
});