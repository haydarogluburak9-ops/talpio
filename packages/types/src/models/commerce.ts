import type { CommissionType, PaymentStatus, TransactionType } from '../enums/statuses';
import type { BaseEntity, Money } from './common';

export interface Payment extends BaseEntity {
  orderId: string;
  status: PaymentStatus;
  amount: Money;
  /** Sağlayıcı tarafındaki referans. Mock sürücüde üretilen kimlik. */
  providerReference?: string | null;
  providerName: string;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  refundedAt?: string | null;
  failureReason?: string | null;
}

export interface Transaction extends BaseEntity {
  paymentId?: string | null;
  orderId?: string | null;
  walletId?: string | null;
  type: TransactionType;
  amount: Money;
  /** İşlem sonrası bakiye. Cüzdan hareketlerinde doldurulur. */
  balanceAfterMinor?: number | null;
  description?: string | null;
}

export interface CommissionRule extends BaseEntity {
  name: string;
  type: CommissionType;
  /** Yüzdelik oran, baz puan cinsinden. 1250 = %12,5. */
  rateBps: number;
  /** Sabit hizmet bedeli (kuruş). */
  fixedMinor: number;
  categoryId?: string | null;
  cityId?: string | null;
  /** Premium ustalara uygulanacak indirimli oran. */
  premiumRateBps?: number | null;
  minAmountMinor?: number | null;
  maxAmountMinor?: number | null;
  priority: number;
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface CommissionBreakdown {
  grossMinor: number;
  commissionMinor: number;
  netPayoutMinor: number;
  currency: string;
  appliedRuleId?: string | null;
  appliedRateBps: number;
  appliedFixedMinor: number;
}

export interface ProviderWallet extends BaseEntity {
  providerProfileId: string;
  currency: string;
  /** Kullanılabilir bakiye (kuruş). */
  balanceMinor: number;
  /** İş tamamlanana kadar bloke edilen tutar (kuruş). */
  pendingMinor: number;
}
