'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function ProfileViewPage() {
  const { user } = useAuthStore();

  return (
    <div className='flex w-full flex-col p-4'>
      <Card className='max-w-md'>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
              <Icons.user className='h-6 w-6 text-primary' />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-sm font-medium text-muted-foreground'>Name</p>
            <p className='text-lg font-semibold'>{user?.firstname || 'User'}</p>
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium text-muted-foreground'>Role</p>
            <p className='text-lg'>{user?.role || 'Member'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}