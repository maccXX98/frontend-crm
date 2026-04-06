import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { productByIdOptions } from '@/features/products/api/queries';
import PageContainer from '@/components/layout/page-container';
import ProductViewPage from '@/features/products/components/product-view-page';
import { apiClient } from '@/lib/api-client';

export const metadata = {
  title: 'Dashboard : Product View',
};

type PageProps = { params: Promise<{ productId: string }> };

// Default options for standalone usage
const DEFAULT_CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

async function getDistributorOptions() {
  try {
    // Use apiClient to call internal route handler which proxies to NestJS
    // Note: apiClient prepends BASE_URL which already includes /api
    // So pass just /distributors → maps to /api/distributors route handler
    const res = await apiClient<{
      success: boolean;
      distributors: Array<{ DistributorID: number; Name: string }>;
    }>('/distributors');
    if (res.distributors && Array.isArray(res.distributors)) {
      return res.distributors.map((d) => ({
        value: d.DistributorID,
        label: d.Name,
      }));
    }
  } catch {
    console.warn('[ProductPage] Failed to fetch distributors');
  }
  return [];
}

async function getCategoryOptions() {
  try {
    const res = await apiClient<{
      success: boolean;
      categories: Array<{ CategoryID: number; Name: string }>;
    }>('/categories');
    if (res.categories && Array.isArray(res.categories)) {
      return res.categories.map((c) => ({
        value: c.CategoryID,
        label: c.Name,
      }));
    }
  } catch {
    console.warn('[ProductPage] Failed to fetch categories');
  }
  return [];
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  if (params.productId !== 'new') {
    void queryClient.prefetchQuery(productByIdOptions(Number(params.productId)));
  }

  // Fetch options for form dropdowns
  const [distributorOptions, categoryOptions] = await Promise.all([
    getDistributorOptions(),
    getCategoryOptions(),
  ]);

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProductViewPage
            productId={params.productId}
            distributorOptions={distributorOptions}
            categoryOptions={categoryOptions}
            currencyOptions={DEFAULT_CURRENCY_OPTIONS}
          />
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
