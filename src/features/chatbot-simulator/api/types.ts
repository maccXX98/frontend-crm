// ============================================================
// Chatbot Simulator Types — Backend-Aligned
// ============================================================

export type ConversationStep =
  | 'IDLE'
  | 'AWAITING_CITY'
  | 'AWAITING_PAYMENT'
  | 'COMPLETED'
  | 'EXPIRED';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export interface MessageLog {
  id: number;
  direction: MessageDirection;
  phone: string;
  messageType: string;
  content: string | null;
  waMessageId: string | null;
  waMessageTimestamp: string | null;
  rawPayload: Record<string, unknown> | null;
  createdAt: string; // ISO string
}

export interface Conversation {
  id: number;
  phone: string;
  currentStep: ConversationStep;
  lastProductId: number | null;
  lastWaMessageId: string | null;
  lastWaMessageTimestamp: string | null;
  metadata: {
    productId?: number;
    cityId?: number;
    paymentMethodId?: number;
    customerId?: number;
    [k: string]: unknown;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  CityID: number;
  city: string;
  cashOnDelivery: boolean;
  template: string;
  image: string;
}

export interface PaymentMethod {
  PaymentMethodID: number;
  method: string;
  template: string;
  image: string;
}

// Meta WebhookPayload (subset sufficient for simulation)
export interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'image' | 'interactive';
          text?: { body: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface SimulateInboundRequest {
  phone: string;
  body: string;
}
