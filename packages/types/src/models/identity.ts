import type { DocumentStatus, DocumentType, UserStatus, VerificationStatus } from '../enums/statuses';
import type { UserRole } from '../enums/roles';
import type { BaseEntity, EntityRef } from './common';
import type { CategoryRef } from './catalog';

export interface User extends BaseEntity {
  email: string;
  phone?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  locale: string;
  /**
   * Fiyatların gösterileceği para birimi (ISO 4217).
   *
   * Daima doludur: kullanıcı seçim yapmamışsa ülkesinden, o da yoksa dilinden
   * türetilir. İstemcinin ayrıca çözümleme yapması gerekmez.
   */
  currency: string;
  /** Para birimi kullanıcının kendi seçimi mi, yoksa türetildi mi. */
  currencyIsExplicit: boolean;
  /** ISO 3166-1 alpha-2. Seçilmemişse null. */
  countryCode?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  lastActiveAt?: string | null;
}

/** Oturum açmış kullanıcının kendi profili. Rol bazlı alanlar isteğe bağlıdır. */
export interface CurrentUser extends User {
  permissions: string[];
  customerProfileId?: string | null;
  providerProfileId?: string | null;
}

export interface CustomerProfile extends BaseEntity {
  userId: string;
  defaultAddressId?: string | null;
  completedJobCount: number;
  averageGivenRating?: number | null;
}

export interface ProviderProfile extends BaseEntity {
  userId: string;
  businessName?: string | null;
  about?: string | null;
  experienceYears?: number | null;
  verificationStatus: VerificationStatus;
  /** Doğrulanmış profil rozeti; belgelerin tamamı onaylandığında true olur. */
  isVerified: boolean;
  isPremium: boolean;
  acceptsUrgentJobs: boolean;
  canIssueInvoice: boolean;
  averageRating?: number | null;
  reviewCount: number;
  completedJobCount: number;
  cancellationRate: number;
  /** Tekliflere ortalama yanıt süresi (dakika). */
  averageResponseMinutes?: number | null;
  categories: CategoryRef[];
  serviceAreas: EntityRef[];
  lastActiveAt?: string | null;
}

/** Müşteriye gösterilen özet kart. Hassas alanlar burada yer almaz. */
export interface ProviderSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isPremium: boolean;
  averageRating?: number | null;
  reviewCount: number;
  completedJobCount: number;
  averageResponseMinutes?: number | null;
  categories: CategoryRef[];
}

export interface ProviderService extends BaseEntity {
  providerProfileId: string;
  categoryId: string;
  subcategoryId?: string | null;
  /** Varsa satıcının bu hizmet için başlangıç fiyatı (kuruş). */
  startingPriceMinor?: number | null;
}

export interface ProviderDocument extends BaseEntity {
  providerProfileId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileId: string;
  expiresAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface ProviderAvailability extends BaseEntity {
  providerProfileId: string;
  /** 0 = Pazar ... 6 = Cumartesi */
  dayOfWeek: number;
  /** "HH:mm" biçiminde yerel saat. */
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Erişim jetonunun geçerlilik süresi (saniye). */
  expiresIn: number;
}

export interface AuthSession {
  user: CurrentUser;
  tokens: AuthTokens;
}
