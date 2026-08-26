import {
  JobRequestStatus,
  OFFERABLE_JOB_STATUSES,
  OrderStatus,
  Permission,
  UserRole,
} from '@talpio/types';

/**
 * Rol → izin matrisi. Bu tablo yalnızca kaba yetkiyi belirler; kaydın
 * sahipliği gibi nesne bazlı kontroller ayrı fonksiyonlarla yapılır ve
 * ikisi birlikte uygulanır.
 */
const MARKETPLACE_PERMISSIONS = [
  Permission.JOB_CREATE,
  Permission.JOB_READ_OWN,
  Permission.JOB_UPDATE_OWN,
  Permission.JOB_CANCEL_OWN,
  Permission.OFFER_CREATE,
  Permission.OFFER_READ_OWN,
  Permission.OFFER_READ_FOR_OWN_JOB,
  Permission.OFFER_ACCEPT,
  Permission.OFFER_WITHDRAW_OWN,
  Permission.ORDER_READ_OWN,
  Permission.ORDER_UPDATE_STATUS,
  Permission.MESSAGE_SEND,
  Permission.MESSAGE_READ_OWN,
  Permission.REVIEW_CREATE,
  Permission.REVIEW_REPLY,
  Permission.PROVIDER_PROFILE_MANAGE_OWN,
  Permission.PROVIDER_DOCUMENT_UPLOAD_OWN,
  Permission.PAYMENT_READ_OWN,
  Permission.SUPPORT_TICKET_CREATE,
  Permission.SUPPORT_TICKET_READ_OWN,
  Permission.REQUEST_CREATE,
  Permission.REQUEST_READ_OWN,
  Permission.REQUEST_READ_MATCHED,
  Permission.REQUEST_UPDATE_OWN,
  Permission.REQUEST_CANCEL_OWN,
  Permission.REQUEST_OFFER_CREATE,
  Permission.REQUEST_OFFER_READ_OWN,
  Permission.REQUEST_OFFER_UPDATE_OWN,
  Permission.REQUEST_OFFER_ACCEPT,
  Permission.SUPPLIER_PROFILE_MANAGE,
  Permission.SOCIAL_PROFILE_MANAGE,
  Permission.SOCIAL_POST_CREATE,
  Permission.SOCIAL_INTERACT,
  Permission.SOCIAL_REPORT,
] as const;

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.CUSTOMER]: MARKETPLACE_PERMISSIONS,
  [UserRole.PROVIDER]: MARKETPLACE_PERMISSIONS,
  [UserRole.SUPPORT]: [
    Permission.JOB_READ_ANY,
    Permission.OFFER_READ_ANY,
    Permission.ORDER_READ_ANY,
    Permission.MESSAGE_READ_ANY,
    Permission.PAYMENT_READ_ANY,
    Permission.SUPPORT_TICKET_HANDLE,
    Permission.SUPPORT_TICKET_READ_OWN,
    Permission.REVIEW_MODERATE,
  ],
  [UserRole.ADMIN]: [
    Permission.JOB_READ_ANY,
    Permission.JOB_MODERATE,
    Permission.OFFER_READ_ANY,
    Permission.ORDER_READ_ANY,
    Permission.ORDER_UPDATE_STATUS,
    Permission.MESSAGE_READ_ANY,
    Permission.REVIEW_MODERATE,
    Permission.PROVIDER_DOCUMENT_VERIFY,
    Permission.PAYMENT_READ_ANY,
    Permission.PAYMENT_REFUND,
    Permission.SUPPORT_TICKET_HANDLE,
    Permission.CATALOG_MANAGE,
    Permission.USER_MANAGE,
    Permission.SETTINGS_MANAGE,
    Permission.AUDIT_LOG_READ,
    Permission.ADMIN_REQUEST_MODERATE,
    Permission.ADMIN_SOCIAL_MODERATE,
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
};

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export interface ActorContext {
  userId: string;
  role: UserRole;
  providerProfileId?: string | null;
}

export interface JobAccessContext {
  customerId: string;
  status: JobRequestStatus;
  /** Teklifi kabul edilmiş satıcının profil kimliği. */
  selectedProviderProfileId?: string | null;
  /** Bu işe teklif vermiş satıcıların profil kimlikleri. */
  offeredProviderProfileIds?: readonly string[];
}

export function isStaff(role: UserRole): boolean {
  return role === UserRole.SUPPORT || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/** İş detayını görüntüleyebilir mi? Havuzdaki yayınlanmış işler satıcılara açıktır. */
export function canViewJob(actor: ActorContext, job: JobAccessContext): boolean {
  if (isStaff(actor.role)) return true;
  if (actor.userId === job.customerId) return true;

  if (actor.providerProfileId) {
    if (job.selectedProviderProfileId === actor.providerProfileId) return true;
    if (job.offeredProviderProfileIds?.includes(actor.providerProfileId)) return true;
    return OFFERABLE_JOB_STATUSES.includes(job.status);
  }

  return false;
}

/**
 * Açık adres ve koordinat yalnızca işi alan satıcıya, iş sahibine ve personele
 * gösterilir. Havuzdaki satıcılar yalnızca ilçe seviyesini görür.
 */
export function canViewFullAddress(actor: ActorContext, job: JobAccessContext): boolean {
  if (isStaff(actor.role)) return true;
  if (actor.userId === job.customerId) return true;
  return (
    actor.providerProfileId != null &&
    job.selectedProviderProfileId === actor.providerProfileId
  );
}

export interface OfferEligibility {
  allowed: boolean;
  reason?:
    | 'NOT_PROVIDER'
    | 'PROFILE_INCOMPLETE'
    | 'NOT_VERIFIED'
    | 'JOB_NOT_OPEN'
    | 'OUT_OF_SERVICE_AREA'
    | 'CATEGORY_MISMATCH'
    | 'DUPLICATE_OFFER';
}

export function canSubmitOffer(input: {
  actor: ActorContext;
  jobStatus: JobRequestStatus;
  jobCategoryId: string;
  jobDistrictId: string;
  providerIsVerified: boolean;
  providerCategoryIds: readonly string[];
  providerDistrictIds: readonly string[];
  hasExistingOffer: boolean;
}): OfferEligibility {
  if (!input.actor.providerProfileId) {
    return { allowed: false, reason: 'NOT_PROVIDER' };
  }
  if (!input.providerIsVerified) {
    return { allowed: false, reason: 'NOT_VERIFIED' };
  }
  if (input.providerCategoryIds.length === 0 || input.providerDistrictIds.length === 0) {
    return { allowed: false, reason: 'PROFILE_INCOMPLETE' };
  }
  if (!OFFERABLE_JOB_STATUSES.includes(input.jobStatus)) {
    return { allowed: false, reason: 'JOB_NOT_OPEN' };
  }
  if (!input.providerCategoryIds.includes(input.jobCategoryId)) {
    return { allowed: false, reason: 'CATEGORY_MISMATCH' };
  }
  if (!input.providerDistrictIds.includes(input.jobDistrictId)) {
    return { allowed: false, reason: 'OUT_OF_SERVICE_AREA' };
  }
  if (input.hasExistingOffer) {
    return { allowed: false, reason: 'DUPLICATE_OFFER' };
  }
  return { allowed: true };
}

/**
 * Değerlendirme yalnızca tamamlanmış ve ödemesi kayıtlı işler için yapılabilir;
 * bu kural sahte yorumları azaltmanın temelidir.
 */
export function canReviewOrder(input: {
  actor: ActorContext;
  orderCustomerId: string;
  orderStatus: OrderStatus;
  hasPaymentRecord: boolean;
  hasExistingReview: boolean;
}): boolean {
  if (input.actor.userId !== input.orderCustomerId) return false;
  if (input.orderStatus !== OrderStatus.COMPLETED) return false;
  if (!input.hasPaymentRecord) return false;
  return !input.hasExistingReview;
}

/** Sohbete yalnızca katılımcılar ve şikâyet incelemesi kapsamında personel erişir. */
export function canAccessConversation(
  actor: ActorContext,
  participantUserIds: readonly string[],
): boolean {
  if (participantUserIds.includes(actor.userId)) return true;
  return hasPermission(actor.role, Permission.MESSAGE_READ_ANY);
}
