import { describe, it, expect } from 'vitest';
import type { Column } from '@tanstack/react-table';
import {
  getCommonPinningStyles,
  getFilterOperators,
  getDefaultFilterOperator,
  getValidFilters
} from '@/lib/data-table';
import { dataTableConfig } from '@/config/data-table';

describe('getCommonPinningStyles', () => {
  const createMockColumn = (overrides: Partial<ReturnType<typeof vi.fn>> = {}) => {
    const mockColumn = {
      getIsPinned: vi.fn(() => false),
      getIsLastColumn: vi.fn(() => false),
      getIsFirstColumn: vi.fn(() => false),
      getStart: vi.fn(() => 0),
      getAfter: vi.fn(() => 0),
      getSize: vi.fn(() => 150),
      ...overrides
    } as unknown as Column<unknown>;
    return mockColumn;
  };

  it('should return sticky position when pinned left', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left')
    });

    const result = getCommonPinningStyles({ column });

    expect(result.position).toBe('sticky');
  });

  it('should return sticky position when pinned right', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'right')
    });

    const result = getCommonPinningStyles({ column });

    expect(result.position).toBe('sticky');
  });

  it('should return relative position when not pinned', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.position).toBe('relative');
  });

  it('should return left box shadow when pinned left and is last left column', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left'),
      getIsLastColumn: vi.fn(() => true)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.boxShadow).toBe('-5px 0 5px -5px var(--border) inset');
  });

  it('should return right box shadow when pinned right and is first right column', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'right'),
      getIsFirstColumn: vi.fn(() => true)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.boxShadow).toBe('5px 0 5px -5px var(--border) inset');
  });

  it('should return undefined boxShadow when pinned but not edge column', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left'),
      getIsLastColumn: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.boxShadow).toBeUndefined();
  });

  it('should return undefined boxShadow when not pinned', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.boxShadow).toBeUndefined();
  });

  it('should return left position when pinned left', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left'),
      getStart: vi.fn(() => 100)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.left).toBe('100px');
  });

  it('should return right position when pinned right', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'right'),
      getAfter: vi.fn(() => 50)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.right).toBe('50px');
  });

  it('should return undefined left when not pinned left', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.left).toBeUndefined();
  });

  it('should return undefined right when not pinned right', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.right).toBeUndefined();
  });

  it('should return background var when pinned', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left')
    });

    const result = getCommonPinningStyles({ column });

    expect(result.background).toBe('var(--background)');
  });

  it('should return undefined background when not pinned', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.background).toBeUndefined();
  });

  it('should return zIndex 1 when pinned', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left')
    });

    const result = getCommonPinningStyles({ column });

    expect(result.zIndex).toBe(1);
  });

  it('should return zIndex 0 when not pinned', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.zIndex).toBe(0);
  });

  it('should always return width from getSize', () => {
    const column = createMockColumn({
      getSize: vi.fn(() => 200)
    });

    const result = getCommonPinningStyles({ column });

    expect(result.width).toBe(200);
  });

  it('should return all pinned properties together', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'left'),
      getIsLastColumn: vi.fn(() => true),
      getStart: vi.fn(() => 100),
      getSize: vi.fn(() => 150)
    });

    const result = getCommonPinningStyles({ column });

    expect(result).toEqual({
      position: 'sticky',
      boxShadow: '-5px 0 5px -5px var(--border) inset',
      left: '100px',
      background: 'var(--background)',
      width: 150,
      zIndex: 1
    });
  });

  it('should handle pinned right with all properties', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => 'right'),
      getIsFirstColumn: vi.fn(() => true),
      getAfter: vi.fn(() => 75),
      getSize: vi.fn(() => 180)
    });

    const result = getCommonPinningStyles({ column });

    expect(result).toEqual({
      position: 'sticky',
      boxShadow: '5px 0 5px -5px var(--border) inset',
      right: '75px',
      background: 'var(--background)',
      width: 180,
      zIndex: 1
    });
  });

  it('should handle not pinned with all properties undefined except width and zIndex', () => {
    const column = createMockColumn({
      getIsPinned: vi.fn(() => false),
      getSize: vi.fn(() => 120)
    });

    const result = getCommonPinningStyles({ column });

    expect(result).toEqual({
      position: 'relative',
      width: 120,
      zIndex: 0
    });
  });
});

describe('getFilterOperators', () => {
  it("should return textOperators for 'text' variant", () => {
    const result = getFilterOperators('text');

    expect(result).toEqual(dataTableConfig.textOperators);
  });

  it("should return numericOperators for 'number' variant", () => {
    const result = getFilterOperators('number');

    expect(result).toEqual(dataTableConfig.numericOperators);
  });

  it("should return numericOperators for 'range' variant", () => {
    const result = getFilterOperators('range');

    expect(result).toEqual(dataTableConfig.numericOperators);
  });

  it("should return dateOperators for 'date' variant", () => {
    const result = getFilterOperators('date');

    expect(result).toEqual(dataTableConfig.dateOperators);
  });

  it("should return dateOperators for 'dateRange' variant", () => {
    const result = getFilterOperators('dateRange');

    expect(result).toEqual(dataTableConfig.dateOperators);
  });

  it("should return booleanOperators for 'boolean' variant", () => {
    const result = getFilterOperators('boolean');

    expect(result).toEqual(dataTableConfig.booleanOperators);
  });

  it("should return selectOperators for 'select' variant", () => {
    const result = getFilterOperators('select');

    expect(result).toEqual(dataTableConfig.selectOperators);
  });

  it("should return multiSelectOperators for 'multiSelect' variant", () => {
    const result = getFilterOperators('multiSelect');

    expect(result).toEqual(dataTableConfig.multiSelectOperators);
  });

  it('should fall back to textOperators for unknown variant', () => {
    // @ts-expect-error testing unknown variant
    const result = getFilterOperators('unknownVariant');

    expect(result).toEqual(dataTableConfig.textOperators);
  });

  it('should return correct operators count for each variant', () => {
    expect(getFilterOperators('text')).toHaveLength(6);
    expect(getFilterOperators('number')).toHaveLength(9);
    expect(getFilterOperators('range')).toHaveLength(9);
    expect(getFilterOperators('date')).toHaveLength(10);
    expect(getFilterOperators('dateRange')).toHaveLength(10);
    expect(getFilterOperators('boolean')).toHaveLength(2);
    expect(getFilterOperators('select')).toHaveLength(4);
    expect(getFilterOperators('multiSelect')).toHaveLength(4);
  });

  it('should verify operator values match FilterOperator type', () => {
    const textOps = getFilterOperators('text');
    expect(textOps.every((op) => dataTableConfig.operators.includes(op.value))).toBe(true);

    const numericOps = getFilterOperators('number');
    expect(numericOps.every((op) => dataTableConfig.operators.includes(op.value))).toBe(true);

    const booleanOps = getFilterOperators('boolean');
    expect(booleanOps.every((op) => dataTableConfig.operators.includes(op.value))).toBe(true);
  });
});

describe('getDefaultFilterOperator', () => {
  it("should return 'iLike' for 'text' variant", () => {
    const result = getDefaultFilterOperator('text');

    expect(result).toBe('iLike');
  });

  it("should return 'eq' for 'number' variant", () => {
    const result = getDefaultFilterOperator('number');

    expect(result).toBe('eq');
  });

  it("should return 'eq' for 'range' variant", () => {
    const result = getDefaultFilterOperator('range');

    expect(result).toBe('eq');
  });

  it("should return 'eq' for 'boolean' variant", () => {
    const result = getDefaultFilterOperator('boolean');

    expect(result).toBe('eq');
  });

  it("should return 'eq' for 'select' variant", () => {
    const result = getDefaultFilterOperator('select');

    expect(result).toBe('eq');
  });

  it("should return 'inArray' for 'multiSelect' variant", () => {
    const result = getDefaultFilterOperator('multiSelect');

    expect(result).toBe('inArray');
  });

  it("should return 'eq' for 'date' variant", () => {
    const result = getDefaultFilterOperator('date');

    expect(result).toBe('eq');
  });

  it("should return 'eq' for 'dateRange' variant", () => {
    const result = getDefaultFilterOperator('dateRange');

    expect(result).toBe('eq');
  });

  it('should fall back to iLike for unknown variant', () => {
    // @ts-expect-error testing unknown variant
    const result = getDefaultFilterOperator('unknownVariant');

    expect(result).toBe('iLike');
  });

  it('should return the first operator value for each variant', () => {
    expect(getDefaultFilterOperator('text')).toBe(getFilterOperators('text')[0].value);
    expect(getDefaultFilterOperator('number')).toBe(getFilterOperators('number')[0].value);
    expect(getDefaultFilterOperator('boolean')).toBe(getFilterOperators('boolean')[0].value);
    expect(getDefaultFilterOperator('select')).toBe(getFilterOperators('select')[0].value);
    expect(getDefaultFilterOperator('multiSelect')).toBe(getFilterOperators('multiSelect')[0].value);
  });
});

describe('getValidFilters', () => {
  it('should remove filters with empty string value', () => {
    const filters = [
      { id: 'name', value: '', operator: 'eq' as const, variant: 'text' as const, filterId: '1' },
      { id: 'status', value: 'Active', operator: 'eq' as const, variant: 'select' as const, filterId: '2' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('status');
  });

  it('should remove filters with null value', () => {
    const filters = [
      {
        id: 'name',
        // @ts-expect-error testing null value
        value: null,
        operator: 'eq' as const,
        variant: 'text' as const,
        filterId: '1'
      },
      { id: 'status', value: 'Active', operator: 'eq' as const, variant: 'select' as const, filterId: '2' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('status');
  });

  it('should remove filters with undefined value', () => {
    const filters = [
      {
        id: 'name',
        // @ts-expect-error testing undefined value
        value: undefined,
        operator: 'eq' as const,
        variant: 'text' as const,
        filterId: '1'
      },
      { id: 'status', value: 'Active', operator: 'eq' as const, variant: 'select' as const, filterId: '2' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('status');
  });

  it('should remove filters with empty array value', () => {
    const filters = [
      { id: 'status', value: [], operator: 'inArray' as const, variant: 'multiSelect' as const, filterId: '1' },
      { id: 'name', value: 'test', operator: 'eq' as const, variant: 'text' as const, filterId: '2' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('name');
  });

  it('should keep filters with non-empty string value', () => {
    const filters = [
      { id: 'name', value: 'test', operator: 'eq' as const, variant: 'text' as const, filterId: '1' },
      { id: 'status', value: 'Active', operator: 'eq' as const, variant: 'select' as const, filterId: '2' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(2);
  });

  it('should keep filters with non-empty array value', () => {
    const filters = [
      {
        id: 'status',
        value: ['Active', 'Inactive'],
        operator: 'inArray' as const,
        variant: 'multiSelect' as const,
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
  });

  it('should keep filters with isEmpty operator regardless of value', () => {
    const filters = [
      { id: 'name', value: '', operator: 'isEmpty' as const, variant: 'text' as const, filterId: '1' },
      {
        id: 'status',
        value: '',
        operator: 'isEmpty' as const,
        variant: 'select' as const,
        filterId: '2'
      }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(2);
  });

  it('should keep filters with isNotEmpty operator regardless of value', () => {
    const filters = [
      {
        id: 'name',
        value: '',
        operator: 'isNotEmpty' as const,
        variant: 'text' as const,
        filterId: '1'
      },
      {
        id: 'status',
        value: '',
        operator: 'isNotEmpty' as const,
        variant: 'select' as const,
        filterId: '2'
      }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(2);
  });

  it('should keep isEmpty filter with any value including non-empty', () => {
    const filters = [
      { id: 'name', value: 'some value', operator: 'isEmpty' as const, variant: 'text' as const, filterId: '1' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
  });

  it('should handle mixed valid and invalid filters', () => {
    const filters = [
      { id: 'name', value: '', operator: 'eq' as const, variant: 'text' as const, filterId: '1' },
      { id: 'status', value: 'Active', operator: 'eq' as const, variant: 'select' as const, filterId: '2' },
      {
        id: 'tags',
        value: [],
        operator: 'inArray' as const,
        variant: 'multiSelect' as const,
        filterId: '3'
      },
      { id: 'desc', value: '', operator: 'isEmpty' as const, variant: 'text' as const, filterId: '4' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(['status', 'desc']);
  });

  it('should return empty array for empty input', () => {
    const result = getValidFilters([]);

    expect(result).toEqual([]);
  });

  it('should handle filters with array value length 1', () => {
    const filters = [
      { id: 'status', value: ['Active'], operator: 'inArray' as const, variant: 'multiSelect' as const, filterId: '1' }
    ];

    const result = getValidFilters(filters);

    expect(result).toHaveLength(1);
  });

  it('should preserve filter order in result', () => {
    const filters = [
      { id: 'a', value: 'value', operator: 'eq' as const, variant: 'text' as const, filterId: '1' },
      { id: 'b', value: '', operator: 'eq' as const, variant: 'text' as const, filterId: '2' },
      { id: 'c', value: 'value', operator: 'eq' as const, variant: 'text' as const, filterId: '3' },
      { id: 'd', value: [], operator: 'inArray' as const, variant: 'multiSelect' as const, filterId: '4' },
      { id: 'e', value: 'value', operator: 'eq' as const, variant: 'text' as const, filterId: '5' }
    ];

    const result = getValidFilters(filters);

    expect(result.map((f) => f.id)).toEqual(['a', 'c', 'e']);
  });
});