import type {
  AdminCommissionRuleSummary,
  AdminJobSummary,
  AdminOfferSummary,
  AdminOrderSummary,
  AdminPaymentSummary,
  AdminProviderSummary,
  AdminTransactionSummary,
  AdminUserSummary,
} from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';

export const adminUserInclude = {
  avatar: { select: { storageKey: true } },
  providerProfile: { select: { verificationStatus: true } },
} satisfies Prisma.UserInclude;

export const adminProviderInclude = {
  user: {
    select: { id: true, email: true, fullName: true, avatar: { select: { storageKey: true } } },
  },
  _count: { select: { services: true, serviceAreas: true } },
  documents: { where: { status: 'PENDING' as const }, select: { id: true } },
} satisfies Prisma.ProviderProfileInclude;

export const adminJobInclude = {
  category: { select: { name: true } },
  city: { select: { name: true } },
  district: { select: { name: true } },
  customer: { select: { fullName: true } },
} satisfies Prisma.JobRequestInclude;

export const adminOfferInclude = {
  jobRequest: { select: { title: true } },
  providerProfile: { select: { businessName: true, user: { select: { fullName: true } } } },
} satisfies Prisma.OfferInclude;

export const adminOrderInclude = {
  jobRequest: { select: { title: true } },
  customer: { select: { fullName: true } },
  providerProfile: { select: { businessName: true, user: { select: { fullName: true } } } },
} satisfies Prisma.OrderInclude;

export const adminPaymentInclude = {
  order: {
    select: {
      jobRequest: { select: { title: true } },
      customer: { select: { fullName: true } },
      providerProfile: { select: { businessName: true, user: { select: { fullName: true } } } },
    },
  },
} satisfies Prisma.PaymentInclude;

export const adminTransactionInclude = {
  wallet: {
    select: {
      providerProfile: { select: { businessName: true, user: { select: { fullName: true } } } },
    },
  },
} satisfies Prisma.TransactionInclude;

export const adminCommissionInclude = {
  category: { select: { name: true } },
  city: { select: { name: true } },
} satisfies Prisma.CommissionRuleInclude;

type AdminUserRow = Prisma.UserGetPayload<{ include: typeof adminUserInclude }>;
type AdminProviderRow = Prisma.ProviderProfileGetPayload<{ include: typeof adminProviderInclude }>;
type AdminJobRow = Prisma.JobRequestGetPayload<{ include: typeof adminJobInclude }>;
type AdminOfferRow = Prisma.OfferGetPayload<{ include: typeof adminOfferInclude }>;
type AdminOrderRow = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;
type AdminPaymentRow = Prisma.PaymentGetPayload<{ include: typeof adminPaymentInclude }>;
type AdminTransactionRow = Prisma.TransactionGetPayload<{
  include: typeof adminTransactionInclude;
}>;
type AdminCommissionRow = Prisma.CommissionRuleGetPayload<{
  include: typeof adminCommissionInclude;
}>;

export function toAdminUser(row: AdminUserRow, fileBaseUrl: string): AdminUserSummary {
  const avatarKey = row.avatar?.storageKey;

  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.fullName,
    avatarUrl: avatarKey ? `${fileBaseUrl}/${avatarKey}` : null,
    role: row.role,
    status: row.status,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    phoneVerifiedAt: row.phoneVerifiedAt?.toISOString() ?? null,
    lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
    verificationStatus: row.providerProfile?.verificationStatus ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminProvider(row: AdminProviderRow, fileBaseUrl: string): AdminProviderSummary {
  const avatarKey = row.user.avatar?.storageKey;

  return {
    id: row.id,
    userId: row.userId,
    displayName: row.businessName ?? row.user.fullName,
    email: row.user.email,
    avatarUrl: avatarKey ? `${fileBaseUrl}/${avatarKey}` : null,
    verificationStatus: row.verificationStatus,
    isPremium: row.isPremium,
    averageRating: row.averageRating === null ? null : Number(row.averageRating),
    reviewCount: row.reviewCount,
    completedJobCount: row.completedJobCount,
    serviceCount: row._count.services,
    serviceAreaCount: row._count.serviceAreas,
    pendingDocumentCount: row.documents.length,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminJob(row: AdminJobRow): AdminJobSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    categoryName: row.category.name,
    cityName: row.city.name,
    districtName: row.district.name,
    customerName: row.customer.fullName,
    offerCount: row.offerCount,
    isUrgent: row.isUrgent,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminOffer(row: AdminOfferRow): AdminOfferSummary {
  return {
    id: row.id,
    jobRequestId: row.jobRequestId,
    jobTitle: row.jobRequest.title,
    providerName: row.providerProfile.businessName ?? row.providerProfile.user.fullName,
    status: row.status,
    price: { amountMinor: row.amountMinor, currency: row.currency },
    validUntil: row.validUntil.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminOrder(row: AdminOrderRow): AdminOrderSummary {
  return {
    id: row.id,
    jobTitle: row.jobRequest.title,
    customerName: row.customer.fullName,
    providerName: row.providerProfile.businessName ?? row.providerProfile.user.fullName,
    status: row.status,
    total: { amountMinor: row.totalMinor, currency: row.currency },
    commission: { amountMinor: row.commissionMinor, currency: row.currency },
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminPayment(row: AdminPaymentRow): AdminPaymentSummary {
  const profile = row.order.providerProfile;

  return {
    id: row.id,
    orderId: row.orderId,
    jobTitle: row.order.jobRequest.title,
    customerName: row.order.customer.fullName,
    providerName: profile.businessName ?? profile.user.fullName,
    status: row.status,
    amount: { amountMinor: row.amountMinor, currency: row.currency },
    paymentProvider: row.providerName,
    providerReference: row.providerReference,
    failureReason: row.failureReason,
    refundedAt: row.refundedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminTransaction(row: AdminTransactionRow): AdminTransactionSummary {
  const profile = row.wallet?.providerProfile;

  return {
    id: row.id,
    type: row.type,
    amount: { amountMinor: row.amountMinor, currency: row.currency },
    balanceAfterMinor: row.balanceAfterMinor,
    description: row.description,
    orderId: row.orderId,
    paymentId: row.paymentId,
    walletOwnerName: profile ? (profile.businessName ?? profile.user.fullName) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminCommissionRule(row: AdminCommissionRow): AdminCommissionRuleSummary {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    rateBps: row.rateBps,
    fixedMinor: row.fixedMinor,
    premiumRateBps: row.premiumRateBps,
    categoryName: row.category?.name ?? null,
    cityName: row.city?.name ?? null,
    minAmountMinor: row.minAmountMinor,
    maxAmountMinor: row.maxAmountMinor,
    priority: row.priority,
    isActive: row.isActive,
    validFrom: row.validFrom?.toISOString() ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
  };
}
