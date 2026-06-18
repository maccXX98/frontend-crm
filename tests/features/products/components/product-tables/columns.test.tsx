import { describe, it, expect, vi } from 'vitest';
import { columns } from '@/features/products/components/product-tables/columns';

vi.mock('./cell-action', () => ({
  CellAction: () => null,
}));
vi.mock('next/image', () => ({
  default: () => null,
}));
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => children,
}));
vi.mock('@/components/ui/table/data-table-column-header', () => ({
  DataTableColumnHeader: () => null,
}));
vi.mock('@/components/icons', () => ({
  Icons: {
    text: () => null,
    media: () => null,
  },
}));

describe('product table columns', () => {
  it('should have exactly 9 column definitions', () => {
    expect(columns).toHaveLength(9);
  });

  it('should have the expected column ids in order', () => {
    const ids = columns.map((c) => c.id);
    expect(ids).toEqual([
      'Image',
      'Name',
      'NickName',
      'categories',
      'distributor',
      'sellingPrice',
      'Description',
      'createdAt',
      'actions',
    ]);
  });

  it('Image column should have accessorKey: "Image"', () => {
    const col = columns.find((c) => c.id === 'Image');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('Image');
  });

  it('Name column should have accessorKey: "Name"', () => {
    const col = columns.find((c) => c.id === 'Name');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('Name');
  });

  it('NickName column should have accessorKey: "NickName"', () => {
    const col = columns.find((c) => c.id === 'NickName');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('NickName');
  });

  it('categories column should have accessorKey: "categories" and enableSorting: false', () => {
    const col = columns.find((c) => c.id === 'categories');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('categories');
    expect((col as any).enableSorting).toBe(false);
  });

  it('distributor column should have accessorKey: "distributor"', () => {
    const col = columns.find((c) => c.id === 'distributor');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('distributor');
  });

  it('Description column should have accessorKey: "Description"', () => {
    const col = columns.find((c) => c.id === 'Description');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('Description');
  });

  it('createdAt column should have accessorKey: "createdAt"', () => {
    const col = columns.find((c) => c.id === 'createdAt');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBe('createdAt');
  });

  it('sellingPrice column should NOT have accessorKey (uses row.original.productPrices)', () => {
    const col = columns.find((c) => c.id === 'sellingPrice');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBeUndefined();
  });

  it('actions column should NOT have accessorKey', () => {
    const col = columns.find((c) => c.id === 'actions');
    expect(col).toBeDefined();
    expect((col as any).accessorKey).toBeUndefined();
  });

  it('categories should have enableSorting: false', () => {
    const col = columns.find((c) => c.id === 'categories') as any;
    expect(col.enableSorting).toBe(false);
  });

  it('Name should have enableColumnFilter: true', () => {
    const col = columns.find((c) => c.id === 'Name') as any;
    expect(col.enableColumnFilter).toBe(true);
  });

  it('categories should have enableColumnFilter: true', () => {
    const col = columns.find((c) => c.id === 'categories') as any;
    expect(col.enableColumnFilter).toBe(true);
  });

  it('other columns should not have enableColumnFilter or it should be falsy', () => {
    const colsWithFilter = columns.filter((c) => (c as any).enableColumnFilter === true);
    expect(colsWithFilter.map((c) => c.id)).toEqual(['Name', 'categories']);
  });

  it('Name column should have meta.variant: "text"', () => {
    const col = columns.find((c) => c.id === 'Name') as any;
    expect(col.meta?.variant).toBe('text');
  });

  it('categories column should have meta.variant: "multiSelect"', () => {
    const col = columns.find((c) => c.id === 'categories') as any;
    expect(col.meta?.variant).toBe('multiSelect');
  });

  it('Name column should have meta.placeholder: "Search products..."', () => {
    const col = columns.find((c) => c.id === 'Name') as any;
    expect(col.meta?.placeholder).toBe('Search products...');
  });

  it('Image column should have string header "IMAGE"', () => {
    const col = columns.find((c) => c.id === 'Image') as any;
    expect(col.header).toBe('IMAGE');
  });

  it('NickName column should have string header "NICKNAME"', () => {
    const col = columns.find((c) => c.id === 'NickName') as any;
    expect(col.header).toBe('NICKNAME');
  });

  it('distributor column should have string header "DISTRIBUTOR"', () => {
    const col = columns.find((c) => c.id === 'distributor') as any;
    expect(col.header).toBe('DISTRIBUTOR');
  });

  it('sellingPrice column should have string header "PRICE"', () => {
    const col = columns.find((c) => c.id === 'sellingPrice') as any;
    expect(col.header).toBe('PRICE');
  });

  it('Description column should have string header "DESCRIPTION"', () => {
    const col = columns.find((c) => c.id === 'Description') as any;
    expect(col.header).toBe('DESCRIPTION');
  });

  it('Name, categories, createdAt should have function headers (DataTableColumnHeader)', () => {
    const nameCol = columns.find((c) => c.id === 'Name') as any;
    const catCol = columns.find((c) => c.id === 'categories') as any;
    const createdCol = columns.find((c) => c.id === 'createdAt') as any;
    expect(typeof nameCol.header).toBe('function');
    expect(typeof catCol.header).toBe('function');
    expect(typeof createdCol.header).toBe('function');
  });

  it('actions column should not have a header property', () => {
    const col = columns.find((c) => c.id === 'actions') as any;
    expect(col.header).toBeUndefined();
  });

  it('each column should have an id', () => {
    for (const col of columns) {
      expect(col.id).toBeDefined();
    }
  });
});