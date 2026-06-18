import { describe, it, expect } from 'vitest';
import { cn, formatBytes } from '@/lib/utils';

describe('cn', () => {
  it('should return empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should return the class name for a single string input', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('should concatenate two string inputs with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should drop falsy values (false && "bar")', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
  });

  it('should drop null and undefined from inputs', () => {
    expect(cn('foo', null, 'bar', undefined)).toBe('foo bar');
  });

  it('should handle object input with truthy/falsy keys', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });

  it('should handle array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should merge conflicting Tailwind classes with twMerge (p-2 vs p-4)', () => {
    // twMerge keeps the last conflicting class
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('should keep non-conflicting classes when merging (p-2 text-red + p-4)', () => {
    // twMerge keeps both; order may vary so just check both present
    const result = cn('p-2 text-red', 'p-4');
    expect(result).toContain('p-4');
    expect(result).toContain('text-red');
  });

  it('should handle mixed inputs: strings, objects, arrays', () => {
    expect(cn('px-2', { py: true }, ['gap-1'])).toBeTruthy();
  });
});

describe('formatBytes', () => {
  it('should return "0 Byte" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Byte');
  });

  it('should return "0 Byte" for 0 bytes with decimals: 2', () => {
    expect(formatBytes(0, { decimals: 2 })).toBe('0 Byte');
  });

  it('should return "1 Bytes" for 1 byte', () => {
    expect(formatBytes(1)).toBe('1 Bytes');
  });

  it('should return "1023 Bytes" for 1023 bytes', () => {
    expect(formatBytes(1023)).toBe('1023 Bytes');
  });

  it('should return "1 KB" for 1024 bytes (i=1)', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('should return "1 MB" for 1024^2 bytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('should return "1 GB" for 1024^3 bytes', () => {
    expect(formatBytes(1024 ** 3)).toBe('1 GB');
  });

  it('should return "1 TB" for 1024^4 bytes', () => {
    expect(formatBytes(1024 ** 4)).toBe('1 TB');
  });

  it('should clamp i at sizes.length - 1 for 1024^5 (1 PB equivalent) → "1024 TB"', () => {
    // 1024^5 = 1.125e15; Math.log(1024^5)/Math.log(1024) ≈ 5
    // i is clamped to sizes.length - 1 = 4 → sizes[4] = 'TB'
    // value = 1024^5 / 1024^4 = 1024 → '1024 TB'
    expect(formatBytes(1024 ** 5)).toBe('1024 TB');
  });

  it('should clamp i at sizes.length - 1 for 1024^5 with accurate → "1024 TiB"', () => {
    expect(formatBytes(1024 ** 5, { sizeType: 'accurate' })).toBe('1024 TiB');
  });

  it('should clamp i at sizes.length - 1 for 1024^6 → "1048576 TB" (sensible large value)', () => {
    // 1024^6 / 1024^4 = 1024^2 = 1048576
    expect(formatBytes(1024 ** 6)).toBe('1048576 TB');
  });

  it('should return "2 KB" for 1536 bytes with default decimals=0 (rounds up)', () => {
    // 1536 / 1024 = 1.5, toFixed(0) = '2'
    expect(formatBytes(1536)).toBe('2 KB');
  });

  it('should return "1.5 KB" for 1536 bytes with decimals: 1', () => {
    expect(formatBytes(1536, { decimals: 1 })).toBe('1.5 KB');
  });

  it('should return "1.50 KB" for 1536 bytes with decimals: 2', () => {
    expect(formatBytes(1536, { decimals: 2 })).toBe('1.50 KB');
  });

  it('should return "1 KiB" for 1024 bytes with sizeType: accurate', () => {
    expect(formatBytes(1024, { sizeType: 'accurate' })).toBe('1 KiB');
  });

  it('should return "1 MiB" for 1024^2 bytes with sizeType: accurate', () => {
    expect(formatBytes(1024 * 1024, { sizeType: 'accurate' })).toBe('1 MiB');
  });

  it('should return "1 GiB" for 1024^3 bytes with sizeType: accurate', () => {
    expect(formatBytes(1024 ** 3, { sizeType: 'accurate' })).toBe('1 GiB');
  });

  it('should handle boundary: 1023 bytes stays in Bytes unit', () => {
    expect(formatBytes(1023)).toBe('1023 Bytes');
  });

  it('should handle boundary: exactly 1024 bytes moves to KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('should handle 500 bytes as 500 Bytes (stays below KB threshold)', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
  });

  it('should handle 500 bytes with sizeType: accurate as 500 Bytes', () => {
    expect(formatBytes(500, { sizeType: 'accurate' })).toBe('500 Bytes');
  });

  it('should handle 0 with accurate sizeType returns "0 Byte"', () => {
    expect(formatBytes(0, { sizeType: 'accurate' })).toBe('0 Byte');
  });
});