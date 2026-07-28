'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { simulateInbound } from '../api/service';
import { simulatorKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import type { PaymentMethod } from '../api/types';

interface PaymentQuickReplyProps {
  phone: string;
  paymentMethods: PaymentMethod[];
}

export function PaymentQuickReply({
  phone,
  paymentMethods,
}: PaymentQuickReplyProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [open, setOpen] = useState(false);

  async function handleSelect(paymentMethodId: string) {
    const method = paymentMethods.find(
      (m) => m.PaymentMethodID === Number(paymentMethodId)
    );
    if (!method) return;

    // The variation keyword is extracted from the template (e.g. "QR" from "pagar con QR")
    const keyword = method.template.split(' ')[0].toLowerCase();
    const queryClient = getQueryClient();

    try {
      await simulateInbound(phone, keyword);
      toast.success('Método de pago enviado', {
        description: `Variación: "${keyword}"`,
      });
      queryClient.invalidateQueries({ queryKey: simulatorKeys.messages(phone) });
      queryClient.invalidateQueries({ queryKey: simulatorKeys.conversation(phone) });
      setOpen(false);
      setSelectedId('');
    } catch (err) {
      toast.error('Error al enviar método de pago', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return (
    <div className='relative'>
      <Button
        type='button'
        variant='secondary'
        size='sm'
        onClick={() => setOpen((v) => !v)}
        className='gap-1.5'
      >
        <Icons.creditCard className='size-3.5' />
        💳 Pago
      </Button>

      {open && (
        <div className='bg-background border shadow-md absolute bottom-full mb-2 right-0 z-50 w-64 rounded-lg p-3'>
          <p className='text-xs font-medium mb-2 text-muted-foreground'>
            Seleccioná método de pago
          </p>
          <Select
            value={selectedId}
            onValueChange={(val) => handleSelect(val)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Elegir método...' />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem
                  key={method.PaymentMethodID}
                  value={String(method.PaymentMethodID)}
                >
                  {method.method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type='button'
            onClick={() => setOpen(false)}
            className='mt-2 text-muted-foreground hover:text-foreground text-xs w-full text-center'
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
