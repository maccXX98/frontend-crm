'use client';

import { useAppForm } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { simulateInbound } from '../api/service';
import { simulatorKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import { urlSimulatorSchema } from '../schemas/simulator.schema';

interface UrlSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
}

export function UrlSimulatorDialog({
  open,
  onOpenChange,
  phone,
}: UrlSimulatorDialogProps) {
  const form = useAppForm({
    defaultValues: {
      phone: phone,
      url: 'https://fb.com/novex.bo/pro-x9',
    },
    validators: {
      onSubmit: urlSimulatorSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const queryClient = getQueryClient();
        // Send the URL as the inbound message body
        await simulateInbound(value.phone, value.url);

        toast.success('Mensaje entrante simulado', {
          description: `URL enviada: ${value.url}`,
        });

        queryClient.invalidateQueries({
          queryKey: simulatorKeys.messages(value.phone),
        });
        queryClient.invalidateQueries({
          queryKey: simulatorKeys.conversation(value.phone),
        });

        onOpenChange(false);
      } catch (err) {
        toast.error('Error al simular mensaje', {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simular mensaje entrante</DialogTitle>
          <DialogDescription>
            Enviá una URL de producto como si llegara desde WhatsApp. El bot
            procesará el enlace y responderá.
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <form.Form id='url-sim-form' className='flex flex-col gap-4'>
            <form.AppField
              name='phone'
              validators={{
                onBlur: urlSimulatorSchema.shape.phone,
              }}
              children={(field) => (
                <field.FieldSet>
                  <field.FieldLabel htmlFor={field.name}>Teléfono</field.FieldLabel>
                  <Input
                    id={field.name}
                    type='tel'
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='59170000999'
                    aria-invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
                  <field.FieldError />
                </field.FieldSet>
              )}
            />

            <form.AppField
              name='url'
              validators={{
                onBlur: urlSimulatorSchema.shape.url,
              }}
              children={(field) => (
                <field.FieldSet>
                  <field.FieldLabel htmlFor={field.name}>
                    URL del producto
                  </field.FieldLabel>
                  <Input
                    id={field.name}
                    type='url'
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='https://fb.com/novex.bo/pro-x9'
                    aria-invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
                  <field.FieldError />
                </field.FieldSet>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <form.SubmitButton>Simular mensaje entrante</form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
