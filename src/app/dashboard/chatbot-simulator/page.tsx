import { SimulatorPage } from '@/features/chatbot-simulator';
import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {
  citiesQueryOptions,
  paymentMethodsQueryOptions,
} from '@/features/chatbot-simulator/api/queries';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Dashboard: Chatbot Simulator' };

export default function Page() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(citiesQueryOptions());
  void queryClient.prefetchQuery(paymentMethodsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className='h-[600px] w-full' />}>
        <SimulatorPage />
      </Suspense>
    </HydrationBoundary>
  );
}
