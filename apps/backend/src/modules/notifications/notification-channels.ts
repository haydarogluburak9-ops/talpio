import { NotificationChannel, NotificationType } from '@ustapilot/types';

/**
 * Tür başına varsayılan kanal eşlemesi.
 *
 * Şemaya kullanıcı tercih modeli eklenmedi: tercih ekranı henüz tasarlanmadığı
 * için tablo boş kalır, her okumada varsayılana düşer ve migration'ın tek
 * getirisi ölü bir tablo olur. Tercih ihtiyacı belirdiğinde `dispatch` içindeki
 * tek karar noktası (`channelsFor`) tabloyu okuyup buradaki eşlemeyi
 * kullanıcının seçtikleriyle kesecek şekilde genişletilir; çağıran alan
 * modülleri değişmez.
 *
 * Eşlemenin mantığı: IN_APP her türde vardır (kalıcı kayıt zaten yazılır).
 * PUSH, kullanıcının o an bilmesi işine yarayan olaylarda eklenir. EMAIL
 * yalnızca para ve hesap durumu gibi belge niteliği taşıyan olaylarda; her
 * mesajda e-posta göndermek kullanıcıyı sisteme değil spam kutusuna götürür.
 * SMS hiçbir bildirim türünde yok: maliyetli ve zorlayıcıdır, doğrulama kodu
 * dışında kullanılması için ürün kararı gerekir.
 */
const CHANNELS: Record<NotificationType, NotificationChannel[]> = {
  [NotificationType.JOB_PUBLISHED]: [NotificationChannel.IN_APP],
  [NotificationType.JOB_MATCHED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.OFFER_RECEIVED]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.OFFER_ACCEPTED]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.OFFER_REJECTED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.OFFER_EXPIRING]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.MESSAGE_RECEIVED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.APPOINTMENT_REMINDER]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.PROVIDER_EN_ROUTE]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.JOB_STARTED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.JOB_COMPLETED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.REVIEW_REQUESTED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.REVIEW_RECEIVED]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  [NotificationType.PAYMENT_RECEIVED]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.PAYOUT_SENT]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.DOCUMENT_APPROVED]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.DOCUMENT_REJECTED]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.SUPPORT_REPLY]: [
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationType.CAMPAIGN]: [NotificationChannel.IN_APP],
};

/** IN_APP kaydı her zaman yazılır; listede olmasa bile eklenir. */
export function channelsFor(type: NotificationType): NotificationChannel[] {
  const channels = CHANNELS[type] ?? [NotificationChannel.IN_APP];

  return channels.includes(NotificationChannel.IN_APP)
    ? channels
    : [NotificationChannel.IN_APP, ...channels];
}
