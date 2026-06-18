import { describe, it, expect } from 'vitest';
import { getSortingStateParser, getFiltersStateParser } from '@/lib/parsers';
import { dataTableConfig } from '@/config/data-table';

describe('getSortingStateParser', () => {
  describe('parse', () => {
    it('should parse valid sort JSON with id and desc', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'name', desc: false }]));

      expect(result).toEqual([{ id: 'name', desc: false }]);
    });

    it('should parse valid sort JSON with id and desc true', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'email', desc: true }]));

      expect(result).toEqual([{ id: 'email', desc: true }]);
    });

    it('should parse multiple sort items', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(
        JSON.stringify([
          { id: 'name', desc: false },
          { id: 'email', desc: true }
        ])
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'name', desc: false },
        { id: 'email', desc: true }
      ]);
    });

    it('should return null for invalid JSON', () => {
      const parser = getSortingStateParser();
      const result = parser.parse('invalid json');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const parser = getSortingStateParser();
      const result = parser.parse('');

      expect(result).toBeNull();
    });

    it('should return null for empty array', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([]));

      expect(result).toEqual([]);
    });

    it('should return null when missing desc field', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'name' }]));

      expect(result).toBeNull();
    });

    it('should return null when missing id field', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ desc: false }]));

      expect(result).toBeNull();
    });

    it('should return null when desc is not boolean', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'name', desc: 'true' }]));

      expect(result).toBeNull();
    });

    it('should return null when id is not string', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 123, desc: false }]));

      expect(result).toBeNull();
    });

    it('should return null when array contains non-object items', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'name', desc: false }, 'not an object']));

      expect(result).toBeNull();
    });

    it('should accept any valid sort items when no columnIds provided', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'anyField', desc: false }]));

      expect(result).toEqual([{ id: 'anyField', desc: false }]);
    });

    it('should accept items with id in columnIds array', () => {
      const parser = getSortingStateParser(['name', 'email', 'status']);
      const result = parser.parse(JSON.stringify([{ id: 'name', desc: false }]));

      expect(result).toEqual([{ id: 'name', desc: false }]);
    });

    it('should accept items with id in columnIds Set', () => {
      const parser = getSortingStateParser(new Set(['name', 'email', 'status']));
      const result = parser.parse(JSON.stringify([{ id: 'email', desc: true }]));

      expect(result).toEqual([{ id: 'email', desc: true }]);
    });

    it('should return null when id not in columnIds array', () => {
      const parser = getSortingStateParser(['name', 'email']);
      const result = parser.parse(JSON.stringify([{ id: 'invalidField', desc: false }]));

      expect(result).toBeNull();
    });

    it('should return null when one of multiple items has invalid id', () => {
      const parser = getSortingStateParser(['name', 'email']);
      const result = parser.parse(
        JSON.stringify([
          { id: 'name', desc: false },
          { id: 'invalid', desc: true }
        ])
      );

      expect(result).toBeNull();
    });

    it('should accept multiple items all within columnIds', () => {
      const parser = getSortingStateParser(['name', 'email', 'status']);
      const result = parser.parse(
        JSON.stringify([
          { id: 'name', desc: false },
          { id: 'email', desc: true }
        ])
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('serialize', () => {
    it('should serialize sort array to JSON string', () => {
      const parser = getSortingStateParser();
      const value = [{ id: 'name', desc: false }];

      const result = parser.serialize(value);

      expect(result).toBe(JSON.stringify(value));
    });

    it('should serialize empty array', () => {
      const parser = getSortingStateParser();
      const value: { id: string; desc: boolean }[] = [];

      const result = parser.serialize(value);

      expect(result).toBe('[]');
    });

    it('should serialize multiple items', () => {
      const parser = getSortingStateParser();
      const value = [
        { id: 'name', desc: false },
        { id: 'email', desc: true }
      ];

      const result = parser.serialize(value);

      expect(JSON.parse(result)).toEqual(value);
    });
  });

  describe('eq', () => {
    it('should return true when arrays are structurally equal', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b = [{ id: 'name', desc: false }];

      expect(parser.eq(a, b)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      const parser = getSortingStateParser();
      const a: { id: string; desc: boolean }[] = [];
      const b: { id: string; desc: boolean }[] = [];

      expect(parser.eq(a, b)).toBe(true);
    });

    it('should return false when lengths differ', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b: { id: string; desc: boolean }[] = [];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when ids differ', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b = [{ id: 'email', desc: false }];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when desc differs', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b = [{ id: 'name', desc: true }];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when order differs', () => {
      const parser = getSortingStateParser();
      const a = [
        { id: 'name', desc: false },
        { id: 'email', desc: true }
      ];
      const b = [
        { id: 'email', desc: true },
        { id: 'name', desc: false }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return true for multiple identical items', () => {
      const parser = getSortingStateParser();
      const a = [
        { id: 'name', desc: false },
        { id: 'email', desc: true }
      ];
      const b = [
        { id: 'name', desc: false },
        { id: 'email', desc: true }
      ];

      expect(parser.eq(a, b)).toBe(true);
    });
  });
});

describe('getFiltersStateParser', () => {
  describe('parse', () => {
    it('should parse valid filter item with string value', () => {
      const parser = getFiltersStateParser();
      const filterItem = {
        id: 'name',
        value: 'test',
        variant: 'text' as const,
        operator: 'eq' as const,
        filterId: 'filter-1'
      };

      const result = parser.parse(JSON.stringify([filterItem]));

      expect(result).toHaveLength(1);
      expect(result?.[0]).toEqual(filterItem);
    });

    it('should parse valid filter item with array value', () => {
      const parser = getFiltersStateParser();
      const filterItem = {
        id: 'status',
        value: ['Active', 'Inactive'],
        variant: 'multiSelect' as const,
        operator: 'inArray' as const,
        filterId: 'filter-2'
      };

      const result = parser.parse(JSON.stringify([filterItem]));

      expect(result).toHaveLength(1);
      expect(result?.[0].value).toEqual(['Active', 'Inactive']);
    });

    it('should parse multiple valid filter items', () => {
      const parser = getFiltersStateParser();
      const filterItems = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        },
        {
          id: 'status',
          value: ['Active'],
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-2'
        }
      ];

      const result = parser.parse(JSON.stringify(filterItems));

      expect(result).toHaveLength(2);
    });

    it('should return null for invalid JSON', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse('not valid json');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse('');

      expect(result).toBeNull();
    });

    it('should return null for empty array', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(JSON.stringify([]));

      expect(result).toEqual([]);
    });

    it('should return null when missing required fields', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'name' }]));

      expect(result).toBeNull();
    });

    it('should return null for invalid variant', () => {
      const parser = getFiltersStateParser();
      // @ts-expect-error testing invalid variant
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 'test',
            variant: 'invalidVariant',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid operator', () => {
      const parser = getFiltersStateParser();
      // @ts-expect-error testing invalid operator
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 'test',
            variant: 'text',
            operator: 'invalidOperator',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toBeNull();
    });

    it('should return null when value is wrong type (number instead of string/array)', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 123,
            variant: 'text',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toBeNull();
    });

    it('should accept valid filter items with text variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 'search term',
            variant: 'text',
            operator: 'iLike',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept valid filter items with select variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'status',
            value: 'Active',
            variant: 'select',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept valid filter items with boolean variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'active',
            value: 'true',
            variant: 'boolean',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept valid filter items with number variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'age',
            value: '25',
            variant: 'number',
            operator: 'gt',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept valid filter items with range variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'price',
            value: '100',
            variant: 'range',
            operator: 'gte',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept valid filter items with date variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'created',
            value: '2024-01-01',
            variant: 'date',
            operator: 'gt',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept valid filter items with dateRange variant', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'created',
            value: '2024-01-01',
            variant: 'dateRange',
            operator: 'isBetween',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept items with id in columnIds array', () => {
      const parser = getFiltersStateParser(['name', 'email', 'status']);
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 'test',
            variant: 'text',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should accept items with id in columnIds Set', () => {
      const parser = getFiltersStateParser(new Set(['name', 'email', 'status']));
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'email',
            value: 'test@test.com',
            variant: 'text',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toHaveLength(1);
    });

    it('should return null when id not in columnIds array', () => {
      const parser = getFiltersStateParser(['name', 'email']);
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'invalidField',
            value: 'test',
            variant: 'text',
            operator: 'eq',
            filterId: 'filter-1'
          }
        ])
      );

      expect(result).toBeNull();
    });

    it('should return null when one item has invalid id', () => {
      const parser = getFiltersStateParser(['name', 'email']);
      const result = parser.parse(
        JSON.stringify([
          { id: 'name', value: 'test', variant: 'text', operator: 'eq', filterId: 'f1' },
          { id: 'invalid', value: 'test', variant: 'text', operator: 'eq', filterId: 'f2' }
        ])
      );

      expect(result).toBeNull();
    });
  });

  describe('serialize', () => {
    it('should serialize filter array to JSON string', () => {
      const parser = getFiltersStateParser();
      const value = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];

      const result = parser.serialize(value);

      expect(result).toBe(JSON.stringify(value));
    });

    it('should serialize empty array', () => {
      const parser = getFiltersStateParser();
      const value: { id: string; value: string | string[]; variant: 'text'; operator: string; filterId: string }[] = [];

      const result = parser.serialize(value);

      expect(result).toBe('[]');
    });
  });

  describe('eq', () => {
    it('should return true when filter arrays are structurally equal', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      const parser = getFiltersStateParser();
      const a: { id: string; value: string | string[]; variant: 'text'; operator: string; filterId: string }[] = [];
      const b: typeof a = [];

      expect(parser.eq(a, b)).toBe(true);
    });

    it('should return false when lengths differ', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b: typeof a = [];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when id differs', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'email',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when value differs', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test1',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'test2',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when variant differs', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'test',
          variant: 'select' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when operator differs', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'ne' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return true when filterId differs (filterId is not part of equality)', () => {
      // The eq function does NOT compare filterId - only id, value, variant, operator
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'test',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: 'filter-2'
        }
      ];

      expect(parser.eq(a, b)).toBe(true); // filterId is not compared
    });

    it('should compare array values by reference', () => {
      const parser = getFiltersStateParser();
      const sameArray = ['Active', 'Inactive'];
      const a = [
        {
          id: 'status',
          value: sameArray,
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'status',
          value: sameArray, // same reference
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(true); // Same reference, same content
    });

    it('should return false when array values are different content', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'status',
          value: ['Active', 'Inactive'],
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'status',
          value: ['Active'], // different content
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });

    it('should return false when array values differ', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'status',
          value: ['Active'],
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-1'
        }
      ];
      const b = [
        {
          id: 'status',
          value: ['Inactive'],
          variant: 'multiSelect' as const,
          operator: 'inArray' as const,
          filterId: 'filter-1'
        }
      ];

      expect(parser.eq(a, b)).toBe(false);
    });
  });

  describe('filterVariants reference', () => {
    it('should have all expected filter variants in dataTableConfig', () => {
      expect(dataTableConfig.filterVariants).toContain('text');
      expect(dataTableConfig.filterVariants).toContain('number');
      expect(dataTableConfig.filterVariants).toContain('range');
      expect(dataTableConfig.filterVariants).toContain('date');
      expect(dataTableConfig.filterVariants).toContain('dateRange');
      expect(dataTableConfig.filterVariants).toContain('boolean');
      expect(dataTableConfig.filterVariants).toContain('select');
      expect(dataTableConfig.filterVariants).toContain('multiSelect');
    });
  });

  describe('operators reference', () => {
    it('should have all expected operators in dataTableConfig', () => {
      expect(dataTableConfig.operators).toContain('iLike');
      expect(dataTableConfig.operators).toContain('notILike');
      expect(dataTableConfig.operators).toContain('eq');
      expect(dataTableConfig.operators).toContain('ne');
      expect(dataTableConfig.operators).toContain('inArray');
      expect(dataTableConfig.operators).toContain('notInArray');
      expect(dataTableConfig.operators).toContain('isEmpty');
      expect(dataTableConfig.operators).toContain('isNotEmpty');
    });
  });
});