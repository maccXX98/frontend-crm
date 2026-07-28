// ============================================================
// Chatbot Simulator Zod Schemas
// ============================================================

import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(7, 'El número debe tener al menos 7 dígitos')
  .regex(/^\+?[0-9]+$/, 'Solo números y +');

export const urlSimulatorSchema = z.object({
  phone: phoneSchema,
  url: z
    .string()
    .min(1, 'La URL no puede estar vacía')
    .url('URL inválida')
    .startsWith('https://', 'Debe ser HTTPS'),
});

export type UrlSimulatorFormValues = z.infer<typeof urlSimulatorSchema>;
