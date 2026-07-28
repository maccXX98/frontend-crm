'use client';

import { Icons } from '@/components/icons';

interface EmptyStateProps {
  onStart: () => void;
}

export function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center'>
      <div className='bg-muted flex size-16 items-center justify-center rounded-full'>
        <Icons.chat className='text-muted-foreground size-8' />
      </div>
      <div className='flex flex-col gap-1'>
        <h3 className='text-lg font-semibold'>Simulador de Chatbot</h3>
        <p className='text-muted-foreground text-sm'>
          Cargá una conversación existing o iniciá una nueva con un número de teléfono.
        </p>
      </div>
      <button
        type='button'
        onClick={onStart}
        className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors'
      >
        <Icons.add className='size-4' />
        Iniciar conversación
      </button>
    </div>
  );
}
