'use client';

import PageContainer from '@/components/layout/page-container';
import { workspacesInfoContent } from '@/config/infoconfig';

export default function WorkspacesPage() {
  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them'
      infoContent={workspacesInfoContent}
    >
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='space-y-4 text-center'>
          <h2 className='text-2xl font-semibold'>Workspaces Feature Coming Soon</h2>
          <p className='text-muted-foreground'>
            Organization management is not yet available with the current authentication provider.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}