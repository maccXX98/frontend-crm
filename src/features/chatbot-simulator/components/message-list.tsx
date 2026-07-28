'use client';

import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import type { MessageLog } from '../api/types';

interface MessageListProps {
  messages: MessageLog[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollArea className='flex-1 px-4 py-3'>
      <div className='flex flex-col gap-3'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'>
            <Icons.chat className='mb-2 size-10 opacity-20' />
            <p className='text-sm'>Sin mensajes</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
