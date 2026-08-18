import type { NotificationChannel, NotificationType } from '../enums/messaging';
import type { Permission, UserRole } from '../enums/roles';
import type {
  CommissionType,
  ComplaintStatus,
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
  SupportTicketStatus,
  TransactionType,
  UserStatus,
  VerificationStatus,
} from '../enums/statuses';
import type { Money } from './common';
import type { NotificationParams } from './messaging';
import type { SupportMessage } from './support';

/**
 * Yönetim panelinin özet kartları.
 *
 * Sayımlar sorgu anında hesaplanır; panelde canlı görünmesi gerektiği için
 * önbelleğe alınmaz ama alanlar dar tutulur, aksi halde her açılışta ağır bir
 * rapor sorgusu çalışırdı.
 */
export interface AdminDashboard {
  users: {
    total: number;
    customers: number;
    providers: number;
    /** Son yedi günde katılanlar. */
    newThisWeek: number;
  };
  providers: {
    verified: number;
    pendingVerification: number;
  };
  jobs: {
    total: number;
    open: number;
    completed: number;
    cancelled: number;
  };
  offers: {
    total: number;
    pending: number;
    accepted: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    /** Tamamlanmış siparişlerin toplam hacmi. */
    completedVolume: Money;
    /** Tamamlanmış siparişlerden kesilen komisyon. */
    commissionEarned: Money;
  };
}

/** Yönetim listelerinde gösterilen kullanıcı satırı. */
export interface AdminUserSummary {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  lastActiveAt?: string | null;
  /** Satıcı hesaplarında doğrulama durumu; diğer rollerde `null`. */
  verificationStatus?: VerificationStatus | null;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen satıcı satırı. */
export interface AdminProviderSummary {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  verificationStatus: VerificationStatus;
  isPremium: boolean;
  averageRating?: number | null;
  reviewCount: number;
  completedJobCount: number;
  serviceCount: number;
  serviceAreaCount: number;
  /** İncelenmeyi bekleyen belge sayısı. */
  pendingDocumentCount: number;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen talep satırı. */
export interface AdminJobSummary {
  id: string;
  title: string;
  status: JobRequestStatus;
  categoryName: string;
  cityName: string;
  districtName: string;
  customerName: string;
  offerCount: number;
  isUrgent: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen teklif satırı. */
export interface AdminOfferSummary {
  id: string;
  jobRequestId: string;
  jobTitle: string;
  providerName: string;
  status: OfferStatus;
  price: Money;
  /** Teklifin geçerlilik sonu. */
  validUntil: string;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen sipariş satırı. */
export interface AdminOrderSummary {
  id: string;
  jobTitle: string;
  customerName: string;
  providerName: string;
  status: OrderStatus;
  total: Money;
  commission: Money;
  createdAt: string;
}

/**
 * Yönetim listelerinde gösterilen ödeme satırı.
 *
 * `providerName` siparişi üstlenen ustayı, `paymentProvider` ödemeyi yürüten
 * sağlayıcıyı belirtir; ikisi farklı kavramdır.
 */
export interface AdminPaymentSummary {
  id: string;
  orderId: string;
  jobTitle: string;
  customerName: string;
  providerName: string;
  status: PaymentStatus;
  amount: Money;
  paymentProvider: string;
  providerReference?: string | null;
  failureReason?: string | null;
  refundedAt?: string | null;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen muhasebe hareketi. */
export interface AdminTransactionSummary {
  id: string;
  type: TransactionType;
  /** İşaretli tutar: girişler pozitif, çıkışlar negatiftir. */
  amount: Money;
  balanceAfterMinor?: number | null;
  description?: string | null;
  orderId?: string | null;
  paymentId?: string | null;
  /** Cüzdan hareketlerinde satıcının adı; ödeme hareketlerinde `null`. */
  walletOwnerName?: string | null;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen komisyon kuralı. */
export interface AdminCommissionRuleSummary {
  id: string;
  name: string;
  type: CommissionType;
  /** Baz puan: 1250 = %12,5. */
  rateBps: number;
  fixedMinor: number;
  premiumRateBps?: number | null;
  categoryName?: string | null;
  cityName?: string | null;
  minAmountMinor?: number | null;
  maxAmountMinor?: number | null;
  priority: number;
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

/** Destek talebi satırı; kullanıcı ve atanmış personel adlarıyla. */
export interface AdminSupportTicketSummary {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: SupportTicketStatus;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  orderId?: string | null;
  lastMessageAt?: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Destek talebi detayı; mesaj zinciriyle birlikte. */
export interface AdminSupportTicketDetail extends AdminSupportTicketSummary {
  messages: SupportMessage[];
}

/** Şikâyet satırı; raporlayan kullanıcı adı ve çözüm notuyla. */
export interface AdminComplaintSummary {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  status: ComplaintStatus;
  subjectType: 'USER' | 'JOB_REQUEST' | 'OFFER' | 'REVIEW' | 'MESSAGE';
  subjectId: string;
  reason: string;
  description?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Yönetim listelerinde gösterilen bildirim satırı.
 *
 * Panelde de metin sunucudan gelmez: tür ve parametreler taşınır, satır
 * başlığı panelin kendi etiket tablosundan çözülür.
 */
export interface AdminNotificationSummary {
  id: string;
  userId: string;
  recipientName: string;
  recipientEmail: string;
  type: NotificationType;
  params: NotificationParams;
  channels: NotificationChannel[];
  deepLink?: string | null;
  readAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

/**
 * Yönetim işlemlerinin denetim kaydı.
 *
 * `changes` alanı serbest biçimlidir: her işlem türü kendi değişiklik özetini
 * yazar ve şema baskısı olmadan yeni işlem eklenebilir.
 */
export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen değerlendirme satırı. */
export interface AdminReviewSummary {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  providerProfileId: string;
  providerName: string;
  jobTitle: string;
  status: ReviewStatus;
  overallRating: number;
  comment?: string | null;
  moderationNote?: string | null;
  hasReply: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sistem ayarı satırı.
 *
 * `isSecret` olanların `value` alanı maskelenmiş metindir; ham sır panellerde
 * ve liste yanıtlarında taşınmaz.
 */
export interface AdminSystemSetting {
  id: string;
  key: string;
  value: unknown;
  description?: string | null;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Rol → izin matrisinin salt okunur paneli. */
export interface AdminRoleMatrix {
  roles: Array<{
    role: UserRole;
    permissions: Permission[];
  }>;
  allPermissions: Permission[];
}
