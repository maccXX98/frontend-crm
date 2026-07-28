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
import type { City } from '../api/types';

interface CityQuickReplyProps {
  phone: string;
  cities: City[];
}

// Map city name variations for keyword matching
const CITY_VARIATIONS: Record<string, string> = {
  'la paz': 'lp',
  'lp': 'lp',
  'santa cruz': 'scz',
  'scz': 'scz',
  'tarija': 'tj',
  'tj': 'tj',
  'cochabamba': 'cbba',
  'cbba': 'cbba',
  'oruro': 'or',
  'or': 'or',
  'potosi': 'pts',
  'pts': 'pts',
  'sucre': 'suc',
  'suc': 'suc',
  'beni': 'bn',
  'bn': 'bn',
  'pando': 'pn',
  'pn': 'pn',
};

export function CityQuickReply({ phone, cities }: CityQuickReplyProps) {
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [open, setOpen] = useState(false);

  async function handleSelect(cityId: string) {
    const city = cities.find((c) => c.CityID === Number(cityId));
    if (!city) return;

    const keyword = CITY_VARIATIONS[city.city.toLowerCase()] ?? city.city;
    const queryClient = getQueryClient();

    try {
      await simulateInbound(phone, keyword);
      toast.success('Ciudad enviada', {
        description: `Variación: "${keyword}"`,
      });
      queryClient.invalidateQueries({ queryKey: simulatorKeys.messages(phone) });
      queryClient.invalidateQueries({ queryKey: simulatorKeys.conversation(phone) });
      setOpen(false);
      setSelectedCityId('');
    } catch (err) {
      toast.error('Error al enviar ciudad', {
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
        <Icons.mapPin className='size-3.5' />
        📍 Ciudad
      </Button>

      {open && (
        <div className='bg-background border shadow-md absolute bottom-full mb-2 right-0 z-50 w-64 rounded-lg p-3'>
          <p className='text-xs font-medium mb-2 text-muted-foreground'>
            Seleccioná una ciudad
          </p>
          <Select
            value={selectedCityId}
            onValueChange={(val) => handleSelect(val)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Elegir ciudad...' />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem
                  key={city.CityID}
                  value={String(city.CityID)}
                >
                  <span className='flex items-center gap-2'>
                    <span>{city.city}</span>
                    {city.cashOnDelivery && (
                      <span className='text-[0.6rem] bg-emerald-100 text-emerald-700 rounded px-1'>
                        CoD
                      </span>
                    )}
                  </span>
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
