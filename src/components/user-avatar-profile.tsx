import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Clerk user shape (for backward compatibility during migration)
interface ClerkUser {
  imageUrl?: string;
  fullName?: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
}

// Backend auth store user shape
interface AuthUser {
  firstname?: string;
  fullName?: string | null;
  photo?: string;
  imageUrl?: string;
  emailAddresses?: Array<{ emailAddress: string }>;
  role?: string;
}

type UserProfile = ClerkUser | AuthUser | null;

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: UserProfile;
}

export function UserAvatarProfile({ className, showInfo = false, user }: UserAvatarProfileProps) {
  // Handle both Clerk user (fullName, imageUrl) and auth store user (firstname, photo)
  const displayName = user?.fullName || (user as AuthUser)?.firstname || '';
  const imageUrl = user?.imageUrl || (user as AuthUser)?.photo || '';
  const email = user?.emailAddresses?.[0]?.emailAddress || (user as AuthUser)?.role || '';

  return (
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src={imageUrl} alt={displayName} />
        <AvatarFallback className='rounded-lg'>
          {displayName?.slice(0, 2)?.toUpperCase() || 'CN'}
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>{displayName}</span>
          <span className='truncate text-xs'>{email}</span>
        </div>
      )}
    </div>
  );
}
