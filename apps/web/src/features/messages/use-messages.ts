'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SendMessageBody } from '@ustapilot/api-client';
import { MESSAGE, queryKeys } from '@ustapilot/config';
import type { Conversation, Message } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

export function useConversations(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.messages.conversations(params),
    queryFn: ({ signal }) => apiClient.messages.listConversations(params, signal),
    // Gerçek zamanlı bağlantı kurulana kadar liste düzenli aralıklarla tazelenir.
    refetchInterval: MESSAGE.pollingIntervalMs,
  });
}

export function useConversation(id: string) {
  return useQuery<Conversation>({
    queryKey: queryKeys.messages.conversation(id),
    queryFn: ({ signal }) => apiClient.messages.getConversation(id, signal),
    enabled: id.length > 0,
  });
}

/**
 * Sohbetin mesajları.
 *
 * Sunucu en yeniden eskiye döner; ekranda kronolojik sıra beklendiği için liste
 * burada ters çevrilir ve sayfa bileşenleri sıralamayla uğraşmaz.
 */
export function useThread(conversationId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.messages.thread(conversationId),
    queryFn: ({ signal }) => apiClient.messages.listMessages(conversationId, { limit }, signal),
    select: (page): Message[] => [...page.items].reverse(),
    enabled: conversationId.length > 0,
    refetchInterval: MESSAGE.pollingIntervalMs,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SendMessageBody) => apiClient.messages.send(conversationId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.all() });
    },
  });
}

/**
 * Sohbeti okundu işaretler.
 *
 * Ekran açıldığında bir kez çağrılır; başarısız olması yazışmayı engellemediği
 * için hata yüzeye taşınmaz.
 */
export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.messages.markRead(conversationId),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.messages.conversation(conversation.id), conversation);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });
}

/** Siparişin sohbetini açar; sohbet yoksa sunucu oluşturur. */
export function useOpenConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => apiClient.messages.openForOrder(orderId),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.messages.conversation(conversation.id), conversation);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });
}
