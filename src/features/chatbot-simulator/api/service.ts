// ============================================================
// Chatbot Simulator Service — Data Access Layer
// ============================================================
// BFF Pattern: calls NestJS backend directly (no auth needed).
// Uses NEXT_PUBLIC_BACKEND_URL from env (defaults to http://localhost:3000/api).
// All endpoints are @Public() on the NestJS side.
// ============================================================

import type {
  City,
  Conversation,
  MessageLog,
  PaymentMethod,
  WebhookPayload,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: `API error: ${res.status}`,
    }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Simulate an inbound message from a WhatsApp client.
 * This enqueues the message to the BullMQ chatbot processor.
 */
export async function simulateInbound(phone: string, bodyText: string): Promise<void> {
  const payload: WebhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'simulator-entry',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: phone,
                phone_number_id: 'simulator-phone-id',
              },
              messages: [
                {
                  from: phone,
                  id: `sim-${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: bodyText },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  await apiFetch<{ status: string }>('/whatsapp/simulate/inbound', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch message logs for a given phone number.
 */
export async function getMessageLogs(
  phone: string,
  limit = 50
): Promise<MessageLog[]> {
  const data = await apiFetch<{ items: MessageLog[] }>(
    `/message-logs/${encodeURIComponent(phone)}?limit=${limit}`
  );
  // The endpoint returns { items: [...] }
  return data.items ?? data;
}

/**
 * Fetch conversation state for a given phone number.
 */
export async function getConversation(phone: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/chatbot/conversations/${encodeURIComponent(phone)}`);
}

/**
 * Fetch all available cities.
 */
export async function getCities(): Promise<City[]> {
  return apiFetch<City[]>('/cities');
}

/**
 * Fetch all available payment methods.
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>('/payment-methods');
}
