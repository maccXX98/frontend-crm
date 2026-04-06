import { queryOptions } from '@tanstack/react-query';
import { getProducts, getProductById } from './service';
import type { ProductFilters } from './types';
import type { ProductEntity } from './types';

export type { ProductEntity };

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => [...productKeys.all, 'list', filters] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};

export const productsQueryOptions = (filters: ProductFilters) =>
  queryOptions({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
  });

export const productByIdOptions = (id: number) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
  });
