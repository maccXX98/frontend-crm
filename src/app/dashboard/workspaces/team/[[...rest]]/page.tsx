'use client';

import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';

export default function TeamPage() {
  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='Manage your workspace team, members, roles, security and more.'
      infoContent={teamInfoContent}
    >
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='space-y-4 text-center'>
          <h2 className='text-2xl font-semibold'>Team Management Coming Soon</h2>
          <p className='text-muted-foreground'>
            Organization team features are not yet available with the current authentication provider.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}