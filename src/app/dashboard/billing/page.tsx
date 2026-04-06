'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { billingInfoContent } from '@/config/infoconfig';

export default function BillingPage() {
  return (
    <PageContainer
      infoContent={billingInfoContent}
      pageTitle='Billing & Plans'
      pageDescription='Manage your subscription and usage limits'
    >
      <div className='space-y-6'>
        {/* Info Alert */}
        <Alert>
          <Icons.info className='h-4 w-4' />
          <AlertDescription>
            Billing and subscription management is not yet available with the current authentication provider.
          </AlertDescription>
        </Alert>

        {/* Placeholder Card */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Billing integration coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex min-h-[200px] items-center justify-center text-muted-foreground'>
              Billing features are not yet available.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}