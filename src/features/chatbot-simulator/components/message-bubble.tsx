'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { MessageLog } from '../api/types';

interface MessageBubbleProps {
  message: MessageLog;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isInbound = message.direction === 'INBOUND';

  const timeAgo = message.createdAt
    ? formatDistanceToNow(new Date(message.createdAt), {
        addSuffix: true,
        locale: es,
      })
    : '';

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isInbound ? 'items-start' : 'items-end'
      )}
    >
      <div
        className={cn(
          'relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isInbound
            ? 'bg-muted text-foreground rounded-bl-md'
            : 'bg-emerald-500 text-white rounded-br-md'
        )}
      >
        {message.messageType === 'image' ? (
          <div className='flex flex-col gap-1'>
            <span className='text-xs opacity-80'>📷 Imagen</span>
            {message.content && (
              <Image
                src={message.content}
                alt='Imagen enviada'
                width={200}
                height={200}
                unoptimized
                className='rounded-lg object-cover'
              />
            )}
          </div>
        ) : (
          <p className='whitespace-pre-wrap break-words'>
            {message.content || <span className='italic opacity-70'>[vacío]</span>}
          </p>
        )}
      </div>
      <span
        className={cn(
          'text-[0.65rem] opacity-60',
          isInbound ? 'text-muted-foreground' : 'text-emerald-200'
        )}
      >
        {timeAgo}
      </span>
    </div>
  );
}
