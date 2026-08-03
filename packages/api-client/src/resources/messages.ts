import { API_ROUTES } from '@ustapilot/config';
import type { Conversation, GeoPoint, Message, MessageType } from '@ustapilot/types';

import type { HttpClient, Paginated } from '../http-client';

export interface ListConversationsParams {
  page?: number;
  limit?: number;
}

export interface ListMessagesParams {
  page?: number;
  limit?: number;
}

export interface SendMessageBody {
  type?: MessageType;
  body?: string;
  attachmentFileIds?: string[];
  location?: GeoPoint;
  /** Aynı mesajın çift gönderilmesini önleyen istemci anahtarı. */
  clientMessageId: string;
}

export function createMessagesResource(http: HttpClient) {
  return {
    /** Siparişin sohbetini açar; zaten varsa aynı sohbet döner. */
    openForOrder(orderId: string): Promise<Conversation> {
      return http.post<Conversation>(API_ROUTES.messages.conversations, { orderId });
    },

    listConversations(
      params: ListConversationsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Conversation>> {
      return http.paginated<Conversation>(API_ROUTES.messages.conversations, {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    getConversation(id: string, signal?: AbortSignal): Promise<Conversation> {
      return http.get<Conversation>(API_ROUTES.messages.conversationById(id), {
        ...(signal ? { signal } : {}),
      });
    },

    /** Mesajlar en yeniden eskiye döner; istemci listeyi ters çevirerek gösterir. */
    listMessages(
      conversationId: string,
      params: ListMessagesParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Message>> {
      return http.paginated<Message>(API_ROUTES.messages.messages(conversationId), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    send(conversationId: string, body: SendMessageBody): Promise<Message> {
      return http.post<Message>(API_ROUTES.messages.messages(conversationId), body);
    },

    markRead(conversationId: string): Promise<Conversation> {
      return http.post<Conversation>(API_ROUTES.messages.read(conversationId));
    },
  };
}

export type MessagesResource = ReturnType<typeof createMessagesResource>;
