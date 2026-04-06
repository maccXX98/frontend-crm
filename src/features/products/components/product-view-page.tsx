'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { ProductEntity } from '../api/types';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { productByIdOptions } from '../api/queries';

type TProductViewPageProps = {
  productId: string;
  distributorOptions: { value: number; label: string }[];
  categoryOptions: { value: number; label: string }[];
  currencyOptions: { value: string; label: string }[];
};

export default function ProductViewPage({
  productId,
  distributorOptions,
  categoryOptions,
  currencyOptions,
}: TProductViewPageProps) {
  if (productId === 'new') {
    return (
      <ProductForm
        initialData={null}
        pageTitle='Create New Product'
        distributorOptions={distributorOptions}
        categoryOptions={categoryOptions}
        currencyOptions={currencyOptions}
      />
    );
  }

  return (
    <EditProductView
      productId={Number(productId)}
      distributorOptions={distributorOptions}
      categoryOptions={categoryOptions}
      currencyOptions={currencyOptions}
    />
  );
}

function EditProductView({
  productId,
  distributorOptions,
  categoryOptions,
  currencyOptions,
}: TProductViewPageProps & { productId: number }) {
  const { data } = useSuspenseQuery(productByIdOptions(productId));

  if (!data?.success || !data?.product) {
    notFound();
  }

  return (
    <ProductForm
      initialData={data.product as ProductEntity}
      pageTitle='Edit Product'
      distributorOptions={distributorOptions}
      categoryOptions={categoryOptions}
      currencyOptions={currencyOptions}
    />
  );
}
