'use client';

import { Icons } from '@/components/icons';
import type { Conversation } from '../api/types';
import type { ConversationStep } from '../api/types';

interface ConversationHeaderProps {
  phone: string;
  conversation: Conversation | undefined;
  onSimulateUrlClick: () => void;
}

const STEP_LABELS: Record<ConversationStep, string> = {
  IDLE: 'IDLE',
  AWAITING_CITY: 'Esperando Ciudad',
  AWAITING_PAYMENT: 'Esperando Pago',
  COMPLETED: 'Completado',
  EXPIRED: 'Expirado',
};

const STEP_VARIANTS: Record<ConversationStep, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  IDLE: 'outline',
  AWAITING_CITY: 'secondary',
  AWAITING_PAYMENT: 'secondary',
  COMPLETED: 'default',
  EXPIRED: 'outline',
};

function StepBadge({ step }: { step: ConversationStep }) {
  return (
    <span
      className='rounded-full px-2.5 py-0.5 text-xs font-medium'
      data-variant={STEP_VARIANTS[step]}
    >
      {STEP_LABELS[step]}
    </span>
  );
}

export function ConversationHeader({
  phone,
  conversation,
  onSimulateUrlClick,
}: ConversationHeaderProps) {
  const currentStep = conversation?.currentStep ?? 'IDLE';

  return (
    <div className='flex items-center justify-between border-b px-4 py-3'>
      <div className='flex items-center gap-3'>
        <div className='bg-muted flex size-10 items-center justify-center rounded-full'>
          <Icons.chat className='text-muted-foreground size-5' />
        </div>
        <div className='flex flex-col'>
          <span className='font-medium text-sm'>{phone || '—'}</span>
          <StepBadge step={currentStep} />
        </div>
      </div>
      <button
        type='button'
        onClick={onSimulateUrlClick}
        className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors'
      >
        <Icons.externalLink className='size-3.5' />
        Simular URL
      </button>
    </div>
  );
}
