'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { EmptyState } from './empty-state';
import { ConversationHeader } from './conversation-header';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';
import { UrlSimulatorDialog } from './url-simulator-dialog';
import {
  citiesQueryOptions,
  conversationQueryOptions,
  messagesQueryOptions,
  paymentMethodsQueryOptions,
} from '../api/queries';

export function SimulatorPage() {
  const [phone, setPhone] = useState('');
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);

  // Static data — loaded once
  const { data: cities } = useSuspenseQuery(citiesQueryOptions());
  const { data: paymentMethods } = useSuspenseQuery(paymentMethodsQueryOptions());

  // Conversation + messages — enabled only when phone is set
  const { data: conversation } = useSuspenseQuery(
    conversationQueryOptions(phone)
  );

  const { data: messages = [] } = useSuspenseQuery(
    messagesQueryOptions(phone)
  );

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Phone input row — sticky top */}
      <div className='border-b bg-background px-4 py-3'>
        <div className='flex items-center gap-2'>
          <Input
            id='phone-input'
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='59170000999'
            className='max-w-xs'
          />
          <span className='text-muted-foreground text-xs'>
            {phone ? 'Conversación activa' : 'Ingresá un número para comenzar'}
          </span>
        </div>
      </div>

      {/* Empty state when no phone */}
      {!phone && (
        <EmptyState
          onStart={() => document.getElementById('phone-input')?.focus()}
        />
      )}

      {/* Chat area when phone is set */}
      {phone && (
        <>
          <ConversationHeader
            phone={phone}
            conversation={conversation}
            onSimulateUrlClick={() => setUrlDialogOpen(true)}
          />

          <MessageList messages={messages} />

          <MessageComposer
            phone={phone}
            conversation={conversation}
            cities={cities}
            paymentMethods={paymentMethods}
          />
        </>
      )}

      {/* URL Simulator Dialog */}
      <UrlSimulatorDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        phone={phone}
      />
    </div>
  );
}
