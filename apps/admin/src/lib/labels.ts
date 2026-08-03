import {
  JOB_STATUS_TONES,
  OFFER_STATUS_TONES,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_TONES,
  type StatusTone,
} from '@ustapilot/config';
import {
  CommissionType,
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  TransactionType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@ustapilot/types';

/**
 * Panel arayüzü yalnızca Türkçedir; bu yüzden etiketler çeviri katmanı yerine
 * burada tutulur. Renk tonları web ve mobil ile aynı kaynaktan gelir, böylece
 * "tamamlandı" her yerde aynı renkte görünür.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Müşteri',
  [UserRole.PROVIDER]: 'Usta',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'Süper admin',
  [UserRole.SUPPORT]: 'Destek',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.PENDING_VERIFICATION]: 'Doğrulama bekliyor',
  [UserStatus.ACTIVE]: 'Etkin',
  [UserStatus.SUSPENDED]: 'Askıda',
  [UserStatus.BANNED]: 'Engelli',
  [UserStatus.DEACTIVATED]: 'Kapatılmış',
};

export const USER_STATUS_TONES: Record<UserStatus, StatusTone> = {
  [UserStatus.PENDING_VERIFICATION]: 'warning',
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.SUSPENDED]: 'warning',
  [UserStatus.BANNED]: 'danger',
  [UserStatus.DEACTIVATED]: 'neutral',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.UNVERIFIED]: 'Doğrulanmamış',
  [VerificationStatus.PENDING]: 'İncelemede',
  [VerificationStatus.VERIFIED]: 'Doğrulanmış',
  [VerificationStatus.REJECTED]: 'Reddedilmiş',
};

export const VERIFICATION_TONES: Record<VerificationStatus, StatusTone> = {
  [VerificationStatus.UNVERIFIED]: 'neutral',
  [VerificationStatus.PENDING]: 'warning',
  [VerificationStatus.VERIFIED]: 'success',
  [VerificationStatus.REJECTED]: 'danger',
};

export const JOB_STATUS_LABELS: Record<JobRequestStatus, string> = {
  [JobRequestStatus.DRAFT]: 'Taslak',
  [JobRequestStatus.PUBLISHED]: 'Yayında',
  [JobRequestStatus.OFFERS_RECEIVED]: 'Teklif aldı',
  [JobRequestStatus.PROVIDER_SELECTED]: 'Usta seçildi',
  [JobRequestStatus.SCHEDULED]: 'Planlandı',
  [JobRequestStatus.PROVIDER_EN_ROUTE]: 'Usta yolda',
  [JobRequestStatus.IN_PROGRESS]: 'Sürüyor',
  [JobRequestStatus.AWAITING_CUSTOMER_APPROVAL]: 'Onay bekliyor',
  [JobRequestStatus.COMPLETED]: 'Tamamlandı',
  [JobRequestStatus.CANCELLED]: 'İptal',
  [JobRequestStatus.DISPUTED]: 'İtirazlı',
  [JobRequestStatus.REFUNDING]: 'İade ediliyor',
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  [OfferStatus.DRAFT]: 'Taslak',
  [OfferStatus.SUBMITTED]: 'Gönderildi',
  [OfferStatus.WITHDRAWN]: 'Geri çekildi',
  [OfferStatus.ACCEPTED]: 'Kabul edildi',
  [OfferStatus.REJECTED]: 'Reddedildi',
  [OfferStatus.EXPIRED]: 'Süresi doldu',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'Ödeme bekliyor',
  [OrderStatus.PAID]: 'Ödendi',
  [OrderStatus.IN_PROGRESS]: 'Sürüyor',
  [OrderStatus.AWAITING_APPROVAL]: 'Onay bekliyor',
  [OrderStatus.COMPLETED]: 'Tamamlandı',
  [OrderStatus.CANCELLED]: 'İptal',
  [OrderStatus.REFUNDED]: 'İade edildi',
  [OrderStatus.DISPUTED]: 'İtirazlı',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Bekliyor',
  [PaymentStatus.AUTHORIZED]: 'Provizyon',
  [PaymentStatus.CAPTURED]: 'Tahsil edildi',
  [PaymentStatus.SETTLED]: 'Mutabık',
  [PaymentStatus.FAILED]: 'Başarısız',
  [PaymentStatus.REFUNDED]: 'İade edildi',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'Kısmi iade',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.PAYMENT]: 'Ödeme',
  [TransactionType.COMMISSION]: 'Komisyon',
  [TransactionType.PAYOUT]: 'Hakediş',
  [TransactionType.REFUND]: 'İade',
  [TransactionType.ADJUSTMENT]: 'Düzeltme',
  [TransactionType.SUBSCRIPTION]: 'Abonelik',
};

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  [CommissionType.PERCENTAGE]: 'Yüzdelik',
  [CommissionType.FIXED]: 'Sabit',
  [CommissionType.HYBRID]: 'Karma',
};

export { JOB_STATUS_TONES, OFFER_STATUS_TONES, ORDER_STATUS_TONES, PAYMENT_STATUS_TONES };

/** Denetim kaydı eylemlerinin okunur karşılıkları. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'user.status.updated': 'Hesap durumu değiştirildi',
  'user.sessions.revoked': 'Oturumlar kapatıldı',
  'provider.verification.updated': 'Usta doğrulaması güncellendi',
  'payment.refunded': 'Ödeme iade edildi',
};
