import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { productByIdOptions } from '@/features/products/api/queries';
import PageContainer from '@/components/layout/page-container';
import ProductViewPage from '@/features/products/components/product-view-page';

export const metadata = {
  title: 'Dashboard : Product View',
};

type PageProps = { params: Promise<{ productId: string }> };

const BFF_BASE = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';

const DEFAULT_CURRENCY_OPTIONS = [
  { value: 'BOB', label: 'BOB (Bs.)' },
  { value: 'USD', label: 'USD ($)' },
];

async function getDistributorOptions() {
  try {
    const res = await fetch(`${BFF_BASE}/api/distributors`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success || !Array.isArray(data.distributors)) return [];
    return data.distributors.map((d: { DistributorID: number; Name: string }) => ({
      value: d.DistributorID,
      label: d.Name,
    }));
  } catch {
    return [];
  }
}

async function getCategoryOptions() {
  try {
    const res = await fetch(`${BFF_BASE}/api/categories`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success || !Array.isArray(data.categories)) return [];
    return data.categories.map((c: { CategoryID: number; Name: string }) => ({
      value: c.CategoryID,
      label: c.Name,
    }));
  } catch {
    return [];
  }
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  if (params.productId !== 'new') {
    void queryClient.prefetchQuery(productByIdOptions(Number(params.productId)));
  }

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
