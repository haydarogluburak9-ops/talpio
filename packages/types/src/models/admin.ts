import type { UserRole } from '../enums/roles';
import type {
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  UserStatus,
  VerificationStatus,
} from '../enums/statuses';
import type { Money } from './common';

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
  /** Usta hesaplarında doğrulama durumu; diğer rollerde `null`. */
  verificationStatus?: VerificationStatus | null;
  createdAt: string;
}

/** Yönetim listelerinde gösterilen usta satırı. */
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
