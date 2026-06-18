import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  productKeys,
  productsQueryOptions,
  productByIdOptions,
} from '@/features/products/api/queries';

// ============================================================
// Mock service layer — must use vi.hoisted so vi.mock can access
// ============================================================
const mocks = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getProductById: vi.fn(),
}));

vi.mock('@/features/products/api/service', () => ({
  getProducts: mocks.getProducts,
  getProductById: mocks.getProductById,
}));

// ============================================================
// Mock query-client
// ============================================================
const mockInvalidateQueries = vi.fn();
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

vi.mock('@/lib/query-client', () => ({
  getQueryClient: () => mockQueryClient,
}));

describe('products api/queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // productKeys
  // ============================================================
  describe('productKeys', () => {
    it('productKeys.all is ["products"]', () => {
      expect(productKeys.all).toEqual(['products']);
    });

    it('productKeys.all is readonly (as const)', () => {
      // as const makes the type readonly — we verify structural value
      expect(productKeys.all).toEqual(['products']);
      expect(productKeys.all).toHaveLength(1);
      expect(productKeys.all[0]).toBe('products');
    });

    it('productKeys.list({ page: 1, limit: 10 }) returns ["products", "list", { page: 1, limit: 10 }]', () => {
      const result = productKeys.list({ page: 1, limit: 10 });
      expect(result).toEqual(['products', 'list', { page: 1, limit: 10 }]);
    });

    it('productKeys.list({}) returns ["products", "list", {}]', () => {
      const result = productKeys.list({});
      expect(result).toEqual(['products', 'list', {}]);
    });

    it('productKeys.list(undefined as any) handles undefined filters edge case', () => {
      // @ts-expect-error intentional invalid input for edge case testing
      const result = productKeys.list(undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('products');
      expect(result[1]).toBe('list');
    });

    it('productKeys.detail(5) returns ["products", "detail", 5]', () => {
      expect(productKeys.detail(5)).toEqual(['products', 'detail', 5]);
    });

    it('productKeys.detail(0) returns ["products", "detail", 0]', () => {
      expect(productKeys.detail(0)).toEqual(['products', 'detail', 0]);
    });

    it('Different filter objects produce different key arrays (cache key uniqueness)', () => {
      const key1 = productKeys.list({ page: 1, limit: 10 });
      const key2 = productKeys.list({ page: 2, limit: 10 });
      const key3 = productKeys.list({ search: 'laptop' });
      expect(key1).not.toEqual(key2);
      expect(key1).not.toEqual(key3);
      expect(key2).not.toEqual(key3);
    });

    it('Two calls with same filters produce structurally equal but different-reference keys', () => {
      const keyA = productKeys.list({ page: 1, limit: 10 });
      const keyB = productKeys.list({ page: 1, limit: 10 });
      expect(keyA).toEqual(keyB);
      expect(keyA).not.toBe(keyB);
    });
  });

  // ============================================================
  // productsQueryOptions
  // ============================================================
  describe('productsQueryOptions', () => {
    it('returns object with queryKey and queryFn', () => {
      const options = productsQueryOptions({ page: 1, limit: 10 });
      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(typeof options.queryFn).toBe('function');
    });

    it('queryKey equals productKeys.list(filters)', () => {
      const filters = { page: 1, limit: 10 };
      const options = productsQueryOptions(filters);
      expect(options.queryKey).toEqual(productKeys.list(filters));
    });

    it('queryFn is a function', () => {
      const options = productsQueryOptions({});
      expect(typeof options.queryFn).toBe('function');
    });

    it('calling queryFn() invokes mocked getProducts(filters) and returns its result', async () => {
      const filters = { page: 1, limit: 10 };
      const mockResponse = {
        success: true,
        products: [],
        total_products: 0,
        message: 'ok',
        time: '2024-01-01',
        offset: 0,
        limit: 10,
      };
      mocks.getProducts.mockResolvedValueOnce(mockResponse);

      const options = productsQueryOptions(filters);
      const result = await options.queryFn();

      expect(mocks.getProducts).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResponse);
    });

    it('different filters → different queryFn args forwarded to getProducts', async () => {
      mocks.getProducts.mockResolvedValue({ success: true, products: [], total_products: 0, message: 'ok', time: '', offset: 0, limit: 10 });

      const options1 = productsQueryOptions({ page: 1, limit: 10 });
      const options2 = productsQueryOptions({ page: 2, limit: 20 });
      const options3 = productsQueryOptions({ search: 'laptop' });

      await options1.queryFn();
      await options2.queryFn();
      await options3.queryFn();

      expect(mocks.getProducts).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(mocks.getProducts).toHaveBeenCalledWith({ page: 2, limit: 20 });
      expect(mocks.getProducts).toHaveBeenCalledWith({ search: 'laptop' });
    });
  });

  // ============================================================
  // productByIdOptions
  // ============================================================
  describe('productByIdOptions', () => {
    it('returns object with queryKey and queryFn', () => {
      const options = productByIdOptions(5);
      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(typeof options.queryFn).toBe('function');
    });

    it('queryKey equals productKeys.detail(id)', () => {
      const options = productByIdOptions(5);
      expect(options.queryKey).toEqual(productKeys.detail(5));
    });

    it('calling queryFn() invokes mocked getProductById(id)', async () => {
      mocks.getProductById.mockResolvedValueOnce({
        success: true,
        product: { ProductID: 5, Name: 'Test Product' },
        message: 'ok',
        time: '2024-01-01',
      });

      const options = productByIdOptions(5);
      await options.queryFn();

      expect(mocks.getProductById).toHaveBeenCalledWith(5);
    });

    it('different ids → getProductById called with correct id each time', async () => {
      mocks.getProductById.mockResolvedValue({ success: true, product: {}, message: 'ok', time: '' });

      const options1 = productByIdOptions(1);
      const options2 = productByIdOptions(99);
      const options3 = productByIdOptions(0);

      await options1.queryFn();
      await options2.queryFn();
      await options3.queryFn();

      expect(mocks.getProductById).toHaveBeenCalledWith(1);
      expect(mocks.getProductById).toHaveBeenCalledWith(99);
      expect(mocks.getProductById).toHaveBeenCalledWith(0);
    });
  });
});
