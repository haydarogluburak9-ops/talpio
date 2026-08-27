import type { ConversationStatus, MessageType } from '../enums/messaging';
import type { NotificationChannel, NotificationType, DevicePlatform } from '../enums/messaging';
import type { PaginationMeta } from '../api/envelope';
import type { BaseEntity, GeoPoint, LocalizedText } from './common';

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  lastReadAt?: string | null;
}

export interface Conversation extends BaseEntity {
  jobRequestId?: string | null;
  orderId?: string | null;
  title?: string | null;
  isGroup?: boolean;
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

/**
 * Bildirim değişkenleri.
 *
 * Okuma yönünde değerler JSON'dan gelir; hangi türün hangi alanı taşıdığı
 * derleme anında bilinemez. Bu yüzden okuma tipi gevşektir ve metin tek bir
 * yerden — `renderNotification` — çözülür. Tip güvenliği bildirimi *üreten*
 * tarafta `NotificationDispatch` ile sağlanır.
 */
export type NotificationParams = Record<string, NotificationParamValue>;

/**
 * Sözlük biçimi, gövdeye yerleşen bir değerin kendisinin de çevrilmesi
 * gerektiği durumlar içindir (kategori adı gibi). `renderNotification` değeri
 * alıcının diline indirger; ham sözlük hiçbir zaman ekrana çıkmaz.
 */
export type NotificationParamValue = string | number | LocalizedText;

/**
 * Tür başına parametre şekli.
 *
 * Tutarlar kuruş cinsinden taşınır ve para birimiyle birlikte gelir; metin
 * istemcide çözüldüğü için biçimlendirme de orada, kullanıcının diliyle yapılır.
 */
export interface NotificationParamsMap {
  JOB_PUBLISHED: { jobTitle: string };
  JOB_MATCHED: { jobTitle: string; categoryName: LocalizedText; districtName: string };
  OFFER_RECEIVED: {
    jobTitle: string;
    providerName: string;
    amountMinor: number;
    currency: string;
  };
  OFFER_ACCEPTED: { jobTitle: string; customerName: string };
  OFFER_REJECTED: { jobTitle: string };
  OFFER_EXPIRING: { jobTitle: string; hoursLeft: number };
  MESSAGE_RECEIVED: { senderName: string; preview: string };
  APPOINTMENT_REMINDER: { jobTitle: string; scheduledAt: string };
  PROVIDER_EN_ROUTE: { jobTitle: string; providerName: string };
  JOB_STARTED: { jobTitle: string; providerName: string };
  JOB_COMPLETED: { jobTitle: string; providerName: string };
  REVIEW_REQUESTED: { jobTitle: string; providerName: string };
  REVIEW_RECEIVED: { customerName: string; rating: number };
  PAYMENT_RECEIVED: { jobTitle: string; amountMinor: number; currency: string };
  PAYOUT_SENT: { jobTitle: string; amountMinor: number; currency: string };
  DOCUMENT_APPROVED: { documentCount: number };
  DOCUMENT_REJECTED: { reason: string };
  SUPPORT_REPLY: { ticketSubject: string };
  /**
   * Kampanya metni doğası gereği yazarın kaleminden çıkar; katalogdan
   * çözülemez. Çok dilli kampanya gerektiğinde şablon kimliği taşıyan ayrı bir
   * model gerekir.
   */
  CAMPAIGN: { title: string; message: string };
  REQUEST_MATCHED: {
    requestId: string;
    requestTitle: string;
    categoryName: LocalizedText;
    cityName: string;
    shortDescription: string;
    deadline: string;
    matchScore: number;
  };
  REQUEST_OFFER_RECEIVED: {
    requestTitle: string;
    businessName: string;
    amountMinor: number;
    currency: string;
  };
  REQUEST_OFFER_ACCEPTED: { requestTitle: string; buyerName: string };
  SOCIAL_FOLLOW: { actorName: string; actorUsername: string };
  SOCIAL_LIKE: { actorName: string; preview: string };
  SOCIAL_COMMENT: { actorName: string; preview: string };
  SOCIAL_MENTION: { actorName: string; preview: string };
  SOCIAL_SHARE: { actorName: string; preview: string };
}

/**
 * Bildirim üretme isteği. Ayrık birleşim, yanlış türe yanlış parametre
 * verilmesini derleme anında yakalar.
 */
export type NotificationDispatch = {
  [T in NotificationType]: { type: T; params: NotificationParamsMap[T] };
}[NotificationType];

/**
 * Bildirim kaydı.
 *
 * `BaseEntity` genişletilmez: bildirim yazıldıktan sonra yalnızca okundu
 * damgası alır, güncellenme veya yumuşak silme kavramı yoktur.
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  /** Metin, istemcide `type` ve `params` üzerinden yerelleştirilir. */
  params: NotificationParams;
  channels: NotificationChannel[];
  /** Dokunulduğunda gidilecek platformdan bağımsız hedef (`talpio://…`). */
  deepLink?: string | null;
  readAt?: string | null;
  /** Uygulama dışı kanallara gönderim denemesinin zamanı. */
  sentAt?: string | null;
  createdAt: string;
}

/** Bildirim listesi, sayfalamanın yanında okunmamış sayacını da taşır. */
export interface NotificationFeedMeta extends PaginationMeta {
  unreadCount: number;
}

export interface DeviceToken extends BaseEntity {
  userId: string;
  platform: DevicePlatform;
  token: string;
  locale: string;
  lastSeenAt: string;
}
