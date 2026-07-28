'use client';

import { FormEvent, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { simulateInbound } from '../api/service';
import { simulatorKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import type { City, Conversation, PaymentMethod } from '../api/types';
import { CityQuickReply } from './city-quick-reply';
import { PaymentQuickReply } from './payment-quick-reply';

interface MessageComposerProps {
  phone: string;
  conversation: Conversation | undefined;
  cities: City[];
  paymentMethods: PaymentMethod[];
}

export function MessageComposer({
  phone,
  conversation,
  cities,
  paymentMethods,
}: MessageComposerProps) {
  const [draft, setDraft] = useState('');
  const queryClient = getQueryClient();
  const currentStep = conversation?.currentStep ?? 'IDLE';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !phone) return;

    setDraft('');
    try {
      await simulateInbound(phone, body);
      queryClient.invalidateQueries({ queryKey: simulatorKeys.messages(phone) });
      queryClient.invalidateQueries({ queryKey: simulatorKeys.conversation(phone) });
    } catch (err) {
      toast.error('Error al enviar mensaje', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      setDraft(body); // restore on error
    }
  }

  return (
    <div className='border-t bg-background px-4 py-3'>
      <form onSubmit={handleSubmit} className='flex items-center gap-2'>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='Escribí un mensaje como el cliente...'
          className='flex-1'
          disabled={!phone}
        />

        {currentStep === 'AWAITING_CITY' && (
          <CityQuickReply phone={phone} cities={cities} />
        )}

        {currentStep === 'AWAITING_PAYMENT' && (
          <PaymentQuickReply phone={phone} paymentMethods={paymentMethods} />
        )}

        <Button
          type='submit'
          size='icon'
          disabled={!draft.trim() || !phone}
          className='shrink-0'
        >
          <Icons.send className='size-4' />
        </Button>
      </form>
    </div>
  );
}
