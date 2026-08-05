import { API_ROUTES } from '@ustapilot/config';
import type {
  DevicePlatform,
  DeviceToken,
  Notification,
  NotificationFeedMeta,
  NotificationType,
} from '@ustapilot/types';

import type { HttpClient, Paginated } from '../http-client';

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  /** Yalnızca okunmamışlar. */
  unread?: boolean;
  type?: NotificationType[];
}

export interface RegisterDeviceTokenInput {
  token: string;
  platform: DevicePlatform;
  locale?: string;
}

/** Mock sürücülerin tamponundan okunan gönderim kaydı. */
export interface MockOutboxEntry {
  channel: string;
  target: string;
  type: NotificationType;
  params: Record<string, string | number>;
  deepLink: string | null;
  locale: string;
  sentAt: string;
}

export function createNotificationsResource(http: HttpClient) {
  return {
    /** Oturumdaki kullanıcının bildirimleri; üst veri okunmamış sayacını taşır. */
    list(
      params: ListNotificationsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Notification, NotificationFeedMeta>> {
      return http.paginated<Notification, NotificationFeedMeta>(API_ROUTES.notifications.root, {
        method: 'GET',
        query: { ...params, type: params.type?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    /** Rozetler için hafif sayaç; liste çekilmez. */
    unreadCount(signal?: AbortSignal): Promise<{ unreadCount: number }> {
      return http.get<{ unreadCount: number }>(API_ROUTES.notifications.unreadCount, {
        ...(signal ? { signal } : {}),
      });
    },

    markRead(id: string): Promise<Notification> {
      return http.post<Notification>(API_ROUTES.notifications.read(id));
    },

    markAllRead(): Promise<{ updatedCount: number }> {
      return http.post<{ updatedCount: number }>(API_ROUTES.notifications.readAll);
    },

    /** Aynı jeton tekrar gönderilirse çift kayıt oluşmaz, son görülme tazelenir. */
    registerDeviceToken(input: RegisterDeviceTokenInput): Promise<DeviceToken> {
      return http.post<DeviceToken>(API_ROUTES.notifications.deviceTokens, input);
    },

    removeDeviceToken(token: string): Promise<{ removed: boolean }> {
      return http.delete<{ removed: boolean }>(API_ROUTES.notifications.deviceTokens, {
        body: { token },
      });
    },

    /** Yalnızca production dışında yanıt verir; duman testi bunu kullanır. */
    mockOutbox(signal?: AbortSignal): Promise<MockOutboxEntry[]> {
      return http.get<MockOutboxEntry[]>(API_ROUTES.notifications.mockOutbox, {
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type NotificationsResource = ReturnType<typeof createNotificationsResource>;
