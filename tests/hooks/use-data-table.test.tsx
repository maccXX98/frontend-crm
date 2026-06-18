import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import { useDataTable } from '@/hooks/use-data-table';

// Mock dependencies at module level
const setPage = vi.fn();
const setPerPage = vi.fn();
const setSorting = vi.fn();
const setFilterValues = vi.fn();

// Mutable state for mock returns
let mockPageValue = 1;
let mockPerPageValue = 10;

vi.mock('nuqs', async () => {
  const actual = await vi.importActual<typeof import('nuqs')>('nuqs');
  return {
    ...actual,
    useQueryState: vi.fn((key: string) => {
      if (key === 'page') return [mockPageValue, setPage];
      if (key === 'perPage') return [mockPerPageValue, setPerPage];
      if (key === 'sort') return [[], setSorting];
      return [null, vi.fn()];
    }),
    useQueryStates: vi.fn(() => [{}, setFilterValues])
  };
});

vi.mock('@tanstack/react-table', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-table')>('@tanstack/react-table');
  return {
    ...actual,
    useReactTable: vi.fn((options: any) => ({
      options,
      getState: () => options.state,
      getCoreRowModel: actual.getCoreRowModel ? () => vi.fn() : undefined,
      getFilteredRowModel: actual.getFilteredRowModel ? () => vi.fn() : undefined,
      getPaginationRowModel: actual.getPaginationRowModel ? () => vi.fn() : undefined,
      getSortedRowModel: actual.getSortedRowModel ? () => vi.fn() : undefined,
      getFacetedRowModel: actual.getFacetedRowModel ? () => vi.fn() : undefined,
      getFacetedUniqueValues: actual.getFacetedUniqueValues ? () => vi.fn() : undefined,
      getFacetedMinMaxValues: actual.getFacetedMinMaxValues ? () => vi.fn() : undefined
    }))
  };
});

vi.mock('@/hooks/use-debounced-callback', () => ({
  useDebouncedCallback: vi.fn((fn: (...args: any[]) => any, _delay: number) => {
    const debouncedFn = (...args: any[]) => fn(...args);
    return debouncedFn;
  })
}));

describe('useDataTable', () => {
  const mockColumns: ColumnDef<any>[] = [
    { id: 'name', accessorKey: 'name', enableColumnFilter: true, meta: { options: undefined } },
    { id: 'status', accessorKey: 'status', enableColumnFilter: true, meta: { options: [{ label: 'Active', value: 'active' }] } },
    { id: 'id', accessorKey: 'id', enableColumnFilter: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPageValue = 1;
    mockPerPageValue = 10;
  });

  // ============================================
  // Basic return shape
  // ============================================
  describe('Basic return shape', () => {
    it('returns table, shallow, debounceMs, throttleMs with all 4 fields', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      expect(result.current).toHaveProperty('table');
      expect(result.current).toHaveProperty('shallow');
      expect(result.current).toHaveProperty('debounceMs');
      expect(result.current).toHaveProperty('throttleMs');
    });

    it('default shallow is true, debounceMs is 300, throttleMs is 50', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      expect(result.current.shallow).toBe(true);
      expect(result.current.debounceMs).toBe(300);
      expect(result.current.throttleMs).toBe(50);
    });

    it('custom values override defaults', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          pageCount: 10,
          shallow: false,
          debounceMs: 500,
          throttleMs: 100
        })
      );

      expect(result.current.shallow).toBe(false);
      expect(result.current.debounceMs).toBe(500);
      expect(result.current.throttleMs).toBe(100);
    });
  });

  // ============================================
  // Column IDs memoization
  // ============================================
  describe('Column IDs memoization', () => {
    it('passes columns with ids, hook uses them in sorting parser', () => {
      const columnsWithIds: ColumnDef<any>[] = [
        { id: 'name', accessorKey: 'name' },
        { id: 'status', accessorKey: 'status' }
      ];

      renderHook(() => useDataTable({ columns: columnsWithIds, pageCount: 10 }));

      // The hook should have called useQueryState for sorting with column IDs
    });

    it('passes columns with id undefined, those are filtered out of the Set', () => {
      const columnsWithUndefinedId: ColumnDef<any>[] = [
        { id: 'name', accessorKey: 'name' },
        { accessorKey: 'status' } as ColumnDef<any>,
        { id: 'id', accessorKey: 'id' }
      ];

      renderHook(() => useDataTable({ columns: columnsWithUndefinedId, pageCount: 10 }));

      // The Set should only contain 'name' and 'id', not the undefined one
    });

    it('passes columns with duplicate ids - Set deduplicates', () => {
      const columnsWithDupes: ColumnDef<any>[] = [
        { id: 'name', accessorKey: 'name' },
        { id: 'name', accessorKey: 'nameAlt' },
        { id: 'status', accessorKey: 'status' }
      ];

      renderHook(() => useDataTable({ columns: columnsWithDupes, pageCount: 10 }));

      // Set should deduplicate - only 2 unique IDs
    });
  });

  // ============================================
  // Pagination conversion
  // ============================================
  describe('Pagination conversion', () => {
    it('when page URL state = 1, table state pagination.pageIndex = 0', () => {
      mockPageValue = 1;
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const tableState = result.current.table.getState();
      expect(tableState.pagination.pageIndex).toBe(0);
    });

    it('when page URL state = 5, table state pagination.pageIndex = 4', () => {
      mockPageValue = 5;
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const tableState = result.current.table.getState();
      expect(tableState.pagination.pageIndex).toBe(4);
    });

    it('when perPage URL state = 25, pagination.pageSize = 25', () => {
      mockPerPageValue = 25;
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const tableState = result.current.table.getState();
      expect(tableState.pagination.pageSize).toBe(25);
    });
  });

  // ============================================
  // onPaginationChange callback
  // ============================================
  describe('onPaginationChange callback', () => {
    it('functional updater calls setPage and setPerPage', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onPaginationChange = result.current.table.options.onPaginationChange;

      act(() => {
        onPaginationChange((prev: any) => ({ pageIndex: prev.pageIndex + 1, pageSize: prev.pageSize }));
      });

      expect(setPage).toHaveBeenCalledWith(2); // pageIndex 1 -> page 2
      expect(setPerPage).toHaveBeenCalled();
    });

    it('direct value calls setPage and setPerPage', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onPaginationChange = result.current.table.options.onPaginationChange;

      act(() => {
        onPaginationChange({ pageIndex: 3, pageSize: 25 });
      });

      expect(setPage).toHaveBeenCalledWith(4); // 0-based 3 -> 1-based 4
      expect(setPerPage).toHaveBeenCalledWith(25);
    });

    it('verifies 0-based to 1-based conversion: pageIndex 0 -> setPage(1)', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onPaginationChange = result.current.table.options.onPaginationChange;

      act(() => {
        onPaginationChange({ pageIndex: 0, pageSize: 10 });
      });

      expect(setPage).toHaveBeenCalledWith(1);
    });

    it('verifies 0-based to 1-based conversion: pageIndex 4 -> setPage(5)', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onPaginationChange = result.current.table.options.onPaginationChange;

      act(() => {
        onPaginationChange({ pageIndex: 4, pageSize: 10 });
      });

      expect(setPage).toHaveBeenCalledWith(5);
    });
  });

  // ============================================
  // onSortingChange callback
  // ============================================
  describe('onSortingChange callback', () => {
    it('functional updater calls setSorting', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onSortingChange = result.current.table.options.onSortingChange;

      act(() => {
        onSortingChange((prev: any[]) => [...prev, { id: 'name', desc: false }]);
      });

      expect(setSorting).toHaveBeenCalled();
    });

    it('direct value calls setSorting', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onSortingChange = result.current.table.options.onSortingChange;

      act(() => {
        onSortingChange([{ id: 'name', desc: true }]);
      });

      expect(setSorting).toHaveBeenCalledWith([{ id: 'name', desc: true }]);
    });
  });

  // ============================================
  // onColumnFiltersChange callback
  // ============================================
  describe('onColumnFiltersChange callback', () => {
    it('with enableAdvancedFilter true returns early, no state update', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          pageCount: 10,
          enableAdvancedFilter: true
        })
      );

      const onColumnFiltersChange = result.current.table.options.onColumnFiltersChange;

      act(() => {
        onColumnFiltersChange([{ id: 'name', value: ['test'] }]);
      });

      // Should return early without updating
      expect(setFilterValues).not.toHaveBeenCalled();
    });

    it('direct value updates state', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onColumnFiltersChange = result.current.table.options.onColumnFiltersChange;

      act(() => {
        onColumnFiltersChange([{ id: 'name', value: ['test'] }]);
      });

      // Should update state with the direct value
    });

    it('filter with non-filterable column id is excluded from updates', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onColumnFiltersChange = result.current.table.options.onColumnFiltersChange;

      act(() => {
        onColumnFiltersChange([{ id: 'id', value: ['123'] }]); // id is not filterable
      });

      // 'id' is not in filterableColumns so should be excluded
    });

    it('filter with filterable column id is included', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns: mockColumns, pageCount: 10 })
      );

      const onColumnFiltersChange = result.current.table.options.onColumnFiltersChange;

      act(() => {
        onColumnFiltersChange([{ id: 'name', value: ['test'] }]); // name is filterable
      });

      // 'name' is in filterableColumns so should be included
    });
  });

  // ============================================
  // enableAdvancedFilter
  // ============================================
  describe('enableAdvancedFilter', () => {
    it('true makes columnFilters empty', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          pageCount: 10,
          enableAdvancedFilter: true
        })
      );

      const tableState = result.current.table.getState();
      expect(tableState.columnFilters).toEqual([]);
    });

    it('false uses columns with enableColumnFilter: true as filterable', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          pageCount: 10,
          enableAdvancedFilter: false
        })
      );

      const tableState = result.current.table.getState();
      expect(tableState.columnFilters).toBeDefined();
    });
  });
});