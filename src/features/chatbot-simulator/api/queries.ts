// ============================================================
// Chatbot Simulator Query Options + Key Factories
// ============================================================

import { queryOptions } from '@tanstack/react-query';
import {
  getCities,
  getConversation,
  getMessageLogs,
  getPaymentMethods,
  simulateInbound,
} from './service';
import type { City, Conversation, MessageLog, PaymentMethod } from './types';

export type { City, Conversation, MessageLog, PaymentMethod };

export const simulatorKeys = {
  all: ['simulator'] as const,
  conversation: (phone: string) =>
    [...simulatorKeys.all, 'conversation', phone] as const,
  messages: (phone: string) => [...simulatorKeys.all, 'messages', phone] as const,
  cities: () => [...simulatorKeys.all, 'cities'] as const,
  paymentMethods: () => [...simulatorKeys.all, 'paymentMethods'] as const,
};

export const conversationQueryOptions = (phone: string) =>
  queryOptions({
    queryKey: simulatorKeys.conversation(phone),
    queryFn: () => getConversation(phone),
    refetchInterval: 2000,
    enabled: !!phone,
    retry: false,
  });

export const messagesQueryOptions = (phone: string, limit = 50) =>
  queryOptions({
    queryKey: simulatorKeys.messages(phone),
    queryFn: () => getMessageLogs(phone, limit),
    refetchInterval: 2000,
    enabled: !!phone,
    retry: false,
  });

export const citiesQueryOptions = () =>
  queryOptions({
    queryKey: simulatorKeys.cities(),
    queryFn: getCities,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const paymentMethodsQueryOptions = () =>
  queryOptions({
    queryKey: simulatorKeys.paymentMethods(),
    queryFn: getPaymentMethods,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export type SimulateParams = { phone: string; body: string };

export async function simulateMutationFn({
  phone,
  body,
}: SimulateParams): Promise<void> {
  await simulateInbound(phone, body);
}
