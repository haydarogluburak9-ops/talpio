import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SendMessageBody } from '@talpio/api-client';
import { MESSAGE, PAGINATION, queryKeys } from '@talpio/config';
import type { Conversation, Message } from '@talpio/types';

import { apiClient } from '@/lib/api';

export function useConversationsInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.conversations(),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.messages.listConversations(
        { page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
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
 * Sunucu en yeniden eskiye döner. Mobil sohbet listesi `inverted` çizildiği için
 * bu sıra doğrudan kullanılır ve ekran tarafında ters çevirme yapılmaz.
 */
export function useThread(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.messages.thread(conversationId),
    queryFn: ({ signal }) =>
      apiClient.messages.listMessages(conversationId, { limit: 50 }, signal),
    select: (page): Message[] => page.items,
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

export function flattenConversationPages(
  pages: { items: Conversation[] }[] | undefined,
): Conversation[] {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { title: string; memberIds: string[] }) =>
      apiClient.social.createGroupConversation(body),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.messages.conversation(conversation.id), conversation);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });
}
