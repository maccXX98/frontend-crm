import { describe, it, expect } from 'vitest';
import { searchParams, searchParamsCache, serialize } from '@/lib/searchparams';

describe('searchParams', () => {
  it('should have exactly 7 keys: page, perPage, name, gender, category, role, sort', () => {
    const keys = Object.keys(searchParams);
    expect(keys).toHaveLength(7);
    expect(keys).toContain('page');
    expect(keys).toContain('perPage');
    expect(keys).toContain('name');
    expect(keys).toContain('gender');
    expect(keys).toContain('category');
    expect(keys).toContain('role');
    expect(keys).toContain('sort');
  });

  it('page should have withDefault(1) and parse integer strings correctly', () => {
    expect(searchParams.page.defaultValue).toBe(1);
    expect(searchParams.page.parse('5')).toBe(5);
    expect(searchParams.page.parse('42')).toBe(42);
    expect(searchParams.page.parse('0')).toBe(0);
  });

  it('page.parse should return null for non-integer strings', () => {
    expect(searchParams.page.parse('abc')).toBe(null);
    // Note: parseAsInteger.parse('1.5') returns 1 (truncates), not null
    expect(searchParams.page.parse('')).toBe(null);
  });

  it('perPage should have withDefault(10) and parse integer strings correctly', () => {
    expect(searchParams.perPage.defaultValue).toBe(10);
    expect(searchParams.perPage.parse('20')).toBe(20);
    expect(searchParams.perPage.parse('50')).toBe(50);
  });

  it('perPage.parse should return null for non-integer strings', () => {
    expect(searchParams.perPage.parse('abc')).toBe(null);
    expect(searchParams.perPage.parse('')).toBe(null);
  });

  it('name should parse string values correctly', () => {
    expect(searchParams.name.parse('john')).toBe('john');
    expect(searchParams.name.parse('Jane Doe')).toBe('Jane Doe');
  });

  it('name.parse should return empty string for empty string input', () => {
    expect(searchParams.name.parse('')).toBe('');
  });

  it('name should have no default value (undefined)', () => {
    expect(searchParams.name.defaultValue).toBeUndefined();
  });

  it('gender should parse string values correctly and have no default', () => {
    expect(searchParams.gender.parse('male')).toBe('male');
    expect(searchParams.gender.parse('female')).toBe('female');
    expect(searchParams.gender.defaultValue).toBeUndefined();
  });

  it('category should parse string values correctly and have no default', () => {
    expect(searchParams.category.parse('electronics')).toBe('electronics');
    expect(searchParams.category.defaultValue).toBeUndefined();
  });

  it('role should parse string values correctly and have no default', () => {
    expect(searchParams.role.parse('admin')).toBe('admin');
    expect(searchParams.role.defaultValue).toBeUndefined();
  });

  it('sort should parse string values correctly and have no default', () => {
    expect(searchParams.sort.parse('createdAt:asc')).toBe('createdAt:asc');
    expect(searchParams.sort.defaultValue).toBeUndefined();
  });

  it('each parser should have parse and serialize methods', () => {
    for (const key of Object.keys(searchParams) as Array<keyof typeof searchParams>) {
      const parser = searchParams[key];
      expect(typeof parser.parse).toBe('function');
      expect(typeof parser.serialize).toBe('function');
    }
  });

  it('name.serialize should return empty string for empty string input', () => {
    expect(searchParams.name.serialize('')).toBe('');
  });

  it('name.serialize should return the string as-is', () => {
    expect(searchParams.name.serialize('john')).toBe('john');
  });
});

describe('searchParamsCache', () => {
  it('should be truthy (exists)', () => {
    expect(searchParamsCache).toBeTruthy();
  });

  it('should have a parse method', () => {
    expect(typeof searchParamsCache.parse).toBe('function');
  });

  it('should have a get method', () => {
    expect(typeof searchParamsCache.get).toBe('function');
  });
});

describe('serialize', () => {
  it('should be a function (the serializer)', () => {
    expect(typeof serialize).toBe('function');
  });

  it('should produce a URLSearchParams string for given params', () => {
    const result = serialize({ page: 2, perPage: 20 });
    expect(result).toBeTruthy();
    expect(result).toMatch(/page=2/);
    expect(result).toMatch(/perPage=20/);
  });

  it('should return empty string for empty params', () => {
    expect(serialize({})).toBe('');
  });

  it('should serialize string params correctly', () => {
    expect(serialize({ name: 'john' })).toMatch(/name=john/);
  });

  it('should skip params that match their default values', () => {
    // page=1 is the default, perPage=10 is the default, so serializer returns ''
    const result = serialize({ page: 1, perPage: 10 });
    expect(result).toBe('');
  });

  it('should serialize non-default values', () => {
    const result = serialize({ page: 2, perPage: 20 });
    expect(result).toMatch(/page=2/);
    expect(result).toMatch(/perPage=20/);
  });
});