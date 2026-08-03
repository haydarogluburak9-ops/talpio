import type { ConversationStatus, MessageType } from '../enums/messaging';
import type { NotificationChannel, NotificationType, DevicePlatform } from '../enums/messaging';
import type { BaseEntity, GeoPoint } from './common';

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  lastReadAt?: string | null;
}

export interface Conversation extends BaseEntity {
  jobRequestId?: string | null;
  orderId?: string | null;
  status: ConversationStatus;
  participants: ConversationParticipant[];
  lastMessage?: MessagePreview | null;
  unreadCount: number;
}

export interface MessagePreview {
  id: string;
  type: MessageType;
  body?: string | null;
  senderId: string;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  fileId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Message extends BaseEntity {
  conversationId: string;
  senderId?: string | null;
  type: MessageType;
  body?: string | null;
  location?: GeoPoint | null;
  attachments: MessageAttachment[];
  /** Kişisel iletişim bilgisi paylaşımı şüphesiyle işaretlenmiş mesaj. */
  isFlagged: boolean;
  readAt?: string | null;
}

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  /** Metin, istemcide `type` ve `params` üzerinden yerelleştirilir. */
  params: Record<string, string | number>;
  channels: NotificationChannel[];
  /** Dokunulduğunda gidilecek uygulama içi yol. */
  deepLink?: string | null;
  readAt?: string | null;
}

export interface DeviceToken extends BaseEntity {
  userId: string;
  platform: DevicePlatform;
  token: string;
  locale: string;
  lastSeenAt: string;
}
