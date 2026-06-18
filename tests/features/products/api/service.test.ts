import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/features/products/api/service';

describe('Products Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getProducts should call fetch with parsed query parameters', async () => {
    const mockData = { products: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await getProducts({ page: 1, limit: 10, search: 'laptop' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products?page=1&limit=10&search=laptop',
      expect.any(Object)
    );
    expect(result).toEqual(mockData);
  });

  it('getProductById should call fetch with correct path', async () => {
    const mockProduct = { id: 5, name: 'Phone' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProduct,
    });

    const result = await getProductById(5);

    expect(mockFetch).toHaveBeenCalledWith('/api/products/5', expect.any(Object));
    expect(result).toEqual(mockProduct);
  });

  it('createProduct should send POST request with correct headers and body', async () => {
    const newProduct = { name: 'Tablet', price: 300 };
    const mockResponse = { id: 10, ...newProduct };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // @ts-expect-error only mock payload properties needed for the test
    const result = await createProduct(newProduct);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('updateProduct should send PATCH request with correct headers and body', async () => {
    const updatePayload = { price: 350 };
    const mockResponse = { id: 10, name: 'Tablet', price: 350 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // @ts-expect-error mock payload
    const result = await updateProduct(10, updatePayload);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products/10',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('deleteProduct should send DELETE request', async () => {
    const mockResponse = { success: true, message: 'Deleted' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await deleteProduct(10);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products/10',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error with custom message when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid payload' }),
    });

    await expect(getProductById(99)).rejects.toThrow('Invalid payload');
  });

  it('should fallback to HTTP status code error message if response body has no message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('No json body');
      },
    });

    await expect(getProductById(99)).rejects.toThrow('API error: 500');
  });
});
