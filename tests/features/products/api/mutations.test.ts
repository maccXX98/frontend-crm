import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createProductMutation,
  updateProductMutation,
  deleteProductMutation,
} from '@/features/products/api/mutations';
import { productKeys } from '@/features/products/api/queries';

// ============================================================
// Mock service layer — must use vi.hoisted
// ============================================================
const mocks = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock('@/features/products/api/service', () => ({
  createProduct: mocks.createProduct,
  updateProduct: mocks.updateProduct,
  deleteProduct: mocks.deleteProduct,
}));

// ============================================================
// Mock query-client
// ============================================================
const mockInvalidateQueries = vi.fn();
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

vi.mock('@/lib/query-client', () => ({
  getQueryClient: () => mockQueryClient,
}));

describe('products api/mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // createProductMutation
  // ============================================================
  describe('createProductMutation', () => {
    it('has mutationFn function', () => {
      expect(typeof createProductMutation.mutationFn).toBe('function');
    });

    it('mutationFn(payload) calls createProduct(payload) and returns its result', async () => {
      const payload = { name: 'New Product', distributorId: 1 };
      const mockResponse = {
        success: true,
        product: { ProductID: 10, Name: 'New Product' },
        message: 'Created',
        time: '2024-01-01',
      };
      mocks.createProduct.mockResolvedValueOnce(mockResponse);

      const result = await createProductMutation.mutationFn(payload);

      expect(mocks.createProduct).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockResponse);
    });

    it('onSuccess calls getQueryClient().invalidateQueries({ queryKey: ["products"] })', async () => {
      await createProductMutation.onSuccess!(
        { success: true, product: {}, message: 'ok', time: '' },
        { name: 'Test' },
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] });
    });

    it('onSuccess receives 3 args: data, variables, context', async () => {
      const mockData = { success: true, product: {}, message: 'ok', time: '' };
      const mockVariables = { name: 'Test Product' };
      const mockContext = undefined;

      await createProductMutation.onSuccess!(mockData, mockVariables, mockContext);

      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateProductMutation
  // ============================================================
  describe('updateProductMutation', () => {
    it('has mutationFn function', () => {
      expect(typeof updateProductMutation.mutationFn).toBe('function');
    });

    it('mutationFn({ id, values }) calls updateProduct(id, values) with correct destructured args', async () => {
      const mockResponse = {
        success: true,
        product: { ProductID: 5, Name: 'Updated' },
        message: 'Updated',
        time: '2024-01-01',
      };
      mocks.updateProduct.mockResolvedValueOnce(mockResponse);

      const result = await updateProductMutation.mutationFn({
        id: 5,
        values: { name: 'Updated Product', distributorId: 2 },
      });

      expect(mocks.updateProduct).toHaveBeenCalledWith(5, {
        name: 'Updated Product',
        distributorId: 2,
      });
      expect(result).toEqual(mockResponse);
    });

    it('onSuccess invalidates ["products"]', async () => {
      await updateProductMutation.onSuccess!(
        { success: true, product: {}, message: 'ok', time: '' },
        { id: 1, values: {} },
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] });
    });
  });

  // ============================================================
  // deleteProductMutation
  // ============================================================
  describe('deleteProductMutation', () => {
    it('has mutationFn function', () => {
      expect(typeof deleteProductMutation.mutationFn).toBe('function');
    });

    it('mutationFn(id) calls deleteProduct(id)', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      mocks.deleteProduct.mockResolvedValueOnce(mockResponse);

      const result = await deleteProductMutation.mutationFn(5);

      expect(mocks.deleteProduct).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResponse);
    });

    it('onSuccess invalidates ["products"]', async () => {
      await deleteProductMutation.onSuccess!(
        { success: true, message: 'Deleted' },
        5,
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] });
    });
  });

  // ============================================================
  // Cross-cutting
  // ============================================================
  describe('cross-cutting concerns', () => {
    it('all 3 mutations invalidate the SAME key (productKeys.all = ["products"])', async () => {
      await createProductMutation.onSuccess!({ success: true, product: {}, message: 'ok', time: '' }, {}, undefined);
      await updateProductMutation.onSuccess!({ success: true, product: {}, message: 'ok', time: '' }, { id: 1, values: {} }, undefined);
      await deleteProductMutation.onSuccess!({ success: true, message: 'ok' }, 1, undefined);

      const allCalls = mockInvalidateQueries.mock.calls.map((c) => c[0]);
      const uniqueKeys = [...new Set(allCalls.map((c) => JSON.stringify(c.queryKey)))];
      expect(uniqueKeys).toHaveLength(1);
      expect(uniqueKeys[0]).toBe(JSON.stringify(['products']));
    });

    it('calling onSuccess completes synchronously without throwing', () => {
      // onSuccess from mutationOptions returns void — verify it doesn't throw
      expect(() =>
        createProductMutation.onSuccess!(
          { success: true, product: {}, message: 'ok', time: '' },
          {},
          undefined
        )
      ).not.toThrow();
    });

    it('invalidateQueries is called with EXACTLY { queryKey: ["products"] } — no extra args', async () => {
      await createProductMutation.onSuccess!(
        { success: true, product: {}, message: 'ok', time: '' },
        {},
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      const callArg = mockInvalidateQueries.mock.calls[0][0];
      expect(callArg).toEqual({ queryKey: ['products'] });
      expect(Object.keys(callArg)).toHaveLength(1);
    });
  });
});
