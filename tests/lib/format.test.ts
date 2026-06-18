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
});
