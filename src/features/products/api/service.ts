// ============================================================
// Product Service — Data Access Layer
// ============================================================
// BFF Pattern: This service calls Next.js route handlers.
// Route handlers proxy requests to NestJS backend.
//
// Route handlers: src/app/api/products/route.ts
//   GET  /api/products      → NestJS GET /products
//   POST /api/products      → NestJS POST /products
//   GET  /api/products/:id → NestJS GET /products/:id
//   PUT  /api/products/:id → NestJS PATCH /products/:id
//   DELETE /api/products/:id → NestJS DELETE /products/:id
//
// NestJS runs on: http://localhost:3001 (or BACKEND_URL env)
// ============================================================

import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload,
  ProductUpdatePayload,
} from './types';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: `Backend error: ${res.status}`,
    }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getProducts(
  filters: ProductFilters
): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.categories) params.set('categories', filters.categories);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiFetch<ProductsResponse>(`/products${query ? `?${query}` : ''}`);
}

export async function getProductById(
  id: number
): Promise<ProductByIdResponse> {
  return apiFetch<ProductByIdResponse>(`/products/${id}`);
}

export async function createProduct(
  data: ProductMutationPayload
): Promise<ProductByIdResponse> {
  return apiFetch<ProductByIdResponse>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: number,
  data: ProductUpdatePayload
): Promise<ProductByIdResponse> {
  return apiFetch<ProductByIdResponse>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(
  id: number
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/products/${id}`, {
    method: 'DELETE',
  });
}
