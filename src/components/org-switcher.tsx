'use client';

import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

// NOTE: Organization switching is disabled until backend supports orgs
// When org support is added, this component will be enhanced with org store

export function OrgSwitcher() {
  const { isMobile, state } = useSidebar();
  const router = useRouter();

  // Static organization placeholder - org switching disabled
  const displayOrganization = {
    name: 'Organization',
    hasImage: false,
    imageUrl: ''
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          onClick={() => router.push('/dashboard/workspaces')}
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
            {displayOrganization.hasImage && displayOrganization.imageUrl ? (
              <img
                src={displayOrganization.imageUrl}
                alt={displayOrganization.name}
                width={32}
                height={32}
                className='size-full object-cover'
              />
            ) : (
              <Icons.galleryVerticalEnd className='size-4' />
            )}
          </div>
          <div
            className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
              state === 'collapsed'
                ? 'invisible max-w-0 overflow-hidden opacity-0'
                : 'visible max-w-full opacity-100'
            }`}
          >
            <span className='truncate font-medium'>{displayOrganization.name}</span>
            <span className='text-muted-foreground truncate text-xs'>
              {isMobile ? '' : 'Organization'}
            </span>
          </div>
          <Icons.chevronsUpDown
            className={`ml-auto transition-all duration-200 ease-in-out ${
              state === 'collapsed'
                ? 'invisible max-w-0 opacity-0'
                : 'visible max-w-full opacity-100'
            }`}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
