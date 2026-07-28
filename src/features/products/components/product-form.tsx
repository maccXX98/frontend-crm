'use client';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProductMutation, updateProductMutation } from '../api/mutations';
import type { ProductEntity } from '../api/types';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { productSchema, type ProductFormValues } from '@/features/products/schemas/product';

import { useRef } from 'react';
import type { ProductEntity, ProductMutationPayload } from '../api/types';

interface ProductFormProps {
  initialData: ProductEntity | null;
  pageTitle: string;
  distributorOptions: { value: number; label: string }[];
  categoryOptions: { value: number; label: string }[];
  currencyOptions: { value: string; label: string }[];
}

export default function ProductForm({
  initialData,
  pageTitle,
  distributorOptions,
  categoryOptions,
  currencyOptions,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const pendingImageRef = useRef<File | null>(null);

  const handleImageUpload = async (productId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        console.error('[ProductForm] Image upload returned error status:', res.status);
      }
    } catch (err) {
      console.error('[ProductForm] Image upload error:', err);
    }
  };

  const createMutation = useMutation({
    ...createProductMutation,
    onSuccess: async (res) => {
      const productId = res?.product?.ProductID;
      if (productId && pendingImageRef.current) {
        toast.info('Uploading product image...');
        await handleImageUpload(productId, pendingImageRef.current);
      }
      toast.success('Product created successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  const updateMutation = useMutation({
    ...updateProductMutation,
    onSuccess: async (res) => {
      const productId = initialData?.ProductID || res?.product?.ProductID;
      if (productId && pendingImageRef.current) {
        toast.info('Uploading product image...');
        await handleImageUpload(productId, pendingImageRef.current);
      }
      toast.success('Product updated successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  // Extract default values from initialData
  const getDefaultDistributorId = (): number | undefined => {
    if (!initialData?.distributor) return undefined;
    return initialData.distributor.DistributorID;
  };

  const getDefaultCategoryIds = (): number[] | undefined => {
    if (!initialData?.categories) return undefined;
    return initialData.categories.map((c) => c.CategoryID);
  };

  const getDefaultCurrency = (): string | undefined => {
    // Get currency from first price if available
    return initialData?.productPrices?.[0]?.Currency || 'BOB';
  };

  const form = useAppForm({
    defaultValues: {
      image: undefined,
      name: initialData?.Name ?? '',
      nickname: initialData?.NickName ?? '',
      description: initialData?.Description ?? '',
      template: initialData?.Template ?? '',
      distributorId: getDefaultDistributorId(),
      categoryIds: getDefaultCategoryIds(),
      cost: initialData?.productPrices?.[0]?.Cost ? Number(initialData.productPrices[0].Cost) : undefined,
      sellingPrice: initialData?.productPrices?.[0]?.SellingPrice ? Number(initialData.productPrices[0].SellingPrice) : undefined,
      currency: getDefaultCurrency(),
    } as ProductFormValues,
    validators: {
      onSubmit: ({ value }) => {
        const processed = {
          ...value,
          distributorId:
            typeof value.distributorId === 'string' && value.distributorId !== ''
              ? Number(value.distributorId)
              : value.distributorId,
          categoryIds:
            typeof value.categoryIds === 'string'
              ? [Number(value.categoryIds)]
              : Array.isArray(value.categoryIds)
              ? value.categoryIds.map(Number)
              : value.categoryIds,
          cost:
            typeof value.cost === 'string' && value.cost !== ''
              ? Number(value.cost)
              : value.cost,
          sellingPrice:
            typeof value.sellingPrice === 'string' && value.sellingPrice !== ''
              ? Number(value.sellingPrice)
              : value.sellingPrice,
        };
        const res = productSchema.safeParse(processed);
        if (!res.success) {
          const errors: Record<string, string> = {};
          for (const issue of res.error.issues) {
            const path = issue.path[0];
            if (typeof path === 'string') {
              errors[path] = issue.message;
            }
          }
          return errors;
        }
        return null;
      },
    },
    onSubmit: ({ value }) => {
      if (value.image?.[0] instanceof File) {
        pendingImageRef.current = value.image[0];
      } else {
        pendingImageRef.current = null;
      }

      const catId = value.categoryIds
        ? Array.isArray(value.categoryIds)
          ? value.categoryIds.map(Number)
          : [Number(value.categoryIds)]
        : undefined;

      // Build mutation payload matching backend DTO (PascalCase)
      const payload: ProductMutationPayload = {
        Name: value.name,
        NickName: value.nickname || undefined,
        Description: value.description,
        Template: value.template || undefined,
        DistributorID: Number(value.distributorId),
        CategoryID: catId,
        Cost: value.cost !== undefined && value.cost !== null && String(value.cost) !== '' ? Number(value.cost) : undefined,
        SellingPrice: value.sellingPrice !== undefined && value.sellingPrice !== null && String(value.sellingPrice) !== '' ? Number(value.sellingPrice) : undefined,
        Currency: value.currency || 'BOB',
      };

      if (isEdit && initialData) {
        updateMutation.mutate({ id: initialData.ProductID, values: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  const {
    FormTextField,
    FormSelectField,
    FormTextareaField,
    FormFileUploadField,
  } = useFormFields<ProductFormValues>();

  const distSelectOptions = distributorOptions.map((d) => ({
    value: String(d.value),
    label: d.label,
  }));

  const catSelectOptions = categoryOptions.map((c) => ({
    value: String(c.value),
    label: c.label,
  }));

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-8'>
            <FormFileUploadField
              name='image'
              label='Product Image'
              description='Upload a product image (optional)'
              maxSize={5 * 1024 * 1024}
              maxFiles={1}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField
                name='name'
                label='Product Name'
                required
                placeholder='Enter product name'
                validators={{
                  onBlur: z.string().min(2, 'Product name must be at least 2 characters.'),
                }}
              />

              <FormTextField
                name='nickname'
                label='Nickname'
                placeholder='Enter nickname (optional)'
              />

              <FormSelectField
                name='distributorId'
                label='Distributor'
                required
                options={distSelectOptions}
                placeholder='Select distributor'
              />

              <FormSelectField
                name='categoryIds'
                label='Category'
                options={catSelectOptions}
                placeholder='Select category (optional)'
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormTextField
                name='cost'
                label='Cost'
                type='number'
                placeholder='Enter cost'
              />

              <FormTextField
                name='sellingPrice'
                label='Selling Price'
                type='number'
                placeholder='Enter selling price'
              />

              <FormSelectField
                name='currency'
                label='Currency'
                options={currencyOptions}
                placeholder='Select currency'
              />
            </div>

            <FormTextareaField
              name='description'
              label='Description'
              required
              placeholder='Enter product description'
              maxLength={500}
              rows={4}
              validators={{
                onBlur: z.string().min(10, 'Description must be at least 10 characters.'),
              }}
            />

            <FormTextareaField
              name='template'
              label='Template'
              placeholder='Enter template (optional)'
              maxLength={500}
              rows={3}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>{isEdit ? 'Update Product' : 'Add Product'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
