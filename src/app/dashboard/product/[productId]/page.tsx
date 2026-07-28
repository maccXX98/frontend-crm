import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { productByIdOptions } from '@/features/products/api/queries';
import PageContainer from '@/components/layout/page-container';
import ProductViewPage from '@/features/products/components/product-view-page';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Dashboard : Product View',
};

type PageProps = { params: Promise<{ productId: string }> };

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// Default currency options
const DEFAULT_CURRENCY_OPTIONS = [
  { value: 'BOB', label: 'BOB (Bs.)' },
  { value: 'USD', label: 'USD ($)' },
];

async function getDistributorOptions() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const res = await fetch(`${BACKEND_URL}/distributors`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.distributors ?? [];
      return list.map((d: { DistributorID: number; Name: string }) => ({
        value: d.DistributorID,
        label: d.Name,
      }));
    }
  } catch (err) {
    console.warn('[ProductPage] Failed to fetch distributors', err);
  }
  return [];
}

async function getCategoryOptions() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const res = await fetch(`${BACKEND_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.categories ?? [];
      return list.map((c: { CategoryID: number; Name: string }) => ({
        value: c.CategoryID,
        label: c.Name,
      }));
    }
  } catch (err) {
    console.warn('[ProductPage] Failed to fetch categories', err);
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
