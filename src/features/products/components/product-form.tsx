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

  const createMutation = useMutation({
    ...createProductMutation,
    onSuccess: () => {
      toast.success('Product created successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  const updateMutation = useMutation({
    ...updateProductMutation,
    onSuccess: () => {
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
    return initialData?.productPrices?.[0]?.Currency;
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
      cost: initialData?.productPrices?.[0]?.Cost,
      sellingPrice: initialData?.productPrices?.[0]?.SellingPrice,
      currency: getDefaultCurrency(),
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema,
    },
    onSubmit: ({ value }) => {
      // Build mutation payload matching backend DTO
      const payload = {
        name: value.name,
        nickname: value.nickname,
        description: value.description,
        template: value.template,
        distributorId: value.distributorId!,
        categoryIds: value.categoryIds,
        // Price creation handled separately or as part of product
        cost: value.cost,
        sellingPrice: value.sellingPrice,
        currency: value.currency,
      };

      if (isEdit && initialData) {
        updateMutation.mutate({ id: initialData.ProductID, values: payload });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createMutation.mutate(payload as any);
      }
    },
  });

  const {
    FormTextField,
    FormSelectField,
    FormTextareaField,
    FormFileUploadField,
    FormNumberField,
    FormComboboxField,
  } = useFormFields<ProductFormValues>();

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

              <FormComboboxField
                name='distributorId'
                label='Distributor'
                required
                options={distributorOptions}
                placeholder='Select distributor'
                validators={{
                  onBlur: z.number({ message: 'Distributor is required' }),
                }}
              />

              <FormComboboxField
                name='categoryIds'
                label='Categories'
                options={categoryOptions}
                placeholder='Select categories (optional)'
                multiple
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormNumberField
                name='cost'
                label='Cost'
                type='number'
                min={0}
                step={0.01}
                placeholder='Enter cost'
              />

              <FormNumberField
                name='sellingPrice'
                label='Selling Price'
                type='number'
                min={0}
                step={0.01}
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
