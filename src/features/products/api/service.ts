// ============================================================
// Product Service — Data Access Layer
// ============================================================
// BFF Pattern: This service calls Next.js route handlers (SAME ORIGIN).
// Route handlers proxy requests to NestJS backend.
//
// Flow:
//   service.ts (calls) → /api/products (Next.js route handler on same origin)
//                              ↓
//                     route handler proxies to NestJS with auth token
//
// IMPORTANT: service.ts calls RELATIVE paths like /api/products
// These go to the Next.js route handler on localhost:3001, NOT directly to NestJS
// This way cookies from localhost:3001 are automatically included
// ============================================================

import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload,
  ProductUpdatePayload,
} from './types';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: `API error: ${res.status}`,
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
  return apiFetch<ProductsResponse>(`/api/products${query ? `?${query}` : ''}`);
}

export async function getProductById(
  id: number
): Promise<ProductByIdResponse> {
  return apiFetch<ProductByIdResponse>(`/api/products/${id}`);
}

export async function createProduct(
  data: ProductMutationPayload
): Promise<ProductByIdResponse> {
  return apiFetch<ProductByIdResponse>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: number,
  data: ProductUpdatePayload
): Promise<ProductByIdResponse> {
  return apiFetch<ProductByIdResponse>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(
  id: number
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}
