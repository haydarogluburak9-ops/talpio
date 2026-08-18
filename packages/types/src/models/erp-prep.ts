/**
 * ERP sınır tipleri — Prisma’da `CrmCustomer` / `WorkOrder` migrate edildi.
 * Marketplace `Order` ile birleştirilmez; `MarketplaceWorkOrderLink` köprüsü kullanılır.
 */

export const WorkOrderSource = {
  TALPIO: 'TALPIO',
  PHONE: 'PHONE',
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  RETURNING: 'RETURNING',
  REFERRAL: 'REFERRAL',
  GOOGLE: 'GOOGLE',
  WEBSITE: 'WEBSITE',
  SAHIBINDEN: 'SAHIBINDEN',
  OTHER: 'OTHER',
} as const;

export type WorkOrderSource = (typeof WorkOrderSource)[keyof typeof WorkOrderSource];

export const WorkOrderStage = {
  NEW: 'NEW',
  SURVEY: 'SURVEY',
  DISCOVERY: 'DISCOVERY',
  QUOTE: 'QUOTE',
  QUOTATION: 'QUOTATION',
  NEGOTIATION: 'NEGOTIATION',
  APPROVED: 'APPROVED',
  MATERIALS: 'MATERIALS',
  APPOINTMENT: 'APPOINTMENT',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  COMPLETED: 'COMPLETED',
  INVOICED: 'INVOICED',
  COLLECTED: 'COLLECTED',
  PAID: 'PAID',
  REVIEWED: 'REVIEWED',
  REFERRED: 'REFERRED',
  REPEAT: 'REPEAT',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkOrderStage = (typeof WorkOrderStage)[keyof typeof WorkOrderStage];

export const CrmCustomerSource = {
  TALPIO: 'TALPIO',
  PHONE: 'PHONE',
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  GOOGLE: 'GOOGLE',
  WEBSITE: 'WEBSITE',
  REFERRAL: 'REFERRAL',
  EXISTING_CUSTOMER: 'EXISTING_CUSTOMER',
  OTHER: 'OTHER',
} as const;

export type CrmCustomerSource = (typeof CrmCustomerSource)[keyof typeof CrmCustomerSource];

export const BusinessTaskStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type BusinessTaskStatus = (typeof BusinessTaskStatus)[keyof typeof BusinessTaskStatus];

export const BusinessTaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type BusinessTaskPriority =
  (typeof BusinessTaskPriority)[keyof typeof BusinessTaskPriority];

export const CampaignAudience = {
  PUBLIC: 'PUBLIC',
  FOLLOWERS: 'FOLLOWERS',
  CATEGORY_TARGETED: 'CATEGORY_TARGETED',
  BUSINESS_ONLY: 'BUSINESS_ONLY',
  B2B_TARGETED: 'B2B_TARGETED',
} as const;

export type CampaignAudience = (typeof CampaignAudience)[keyof typeof CampaignAudience];

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const FraudFlagStatus = {
  OPEN: 'OPEN',
  REVIEWING: 'REVIEWING',
  DISMISSED: 'DISMISSED',
  CONFIRMED: 'CONFIRMED',
} as const;

export type FraudFlagStatus = (typeof FraudFlagStatus)[keyof typeof FraudFlagStatus];

export const FraudFlagReason = {
  MANY_REQUESTS: 'MANY_REQUESTS',
  MANY_OFFERS: 'MANY_OFFERS',
  FAKE_ENGAGEMENT: 'FAKE_ENGAGEMENT',
  REVIEW_FARMING: 'REVIEW_FARMING',
  MULTI_ACCOUNT: 'MULTI_ACCOUNT',
  SPAM_MESSAGES: 'SPAM_MESSAGES',
  OTHER: 'OTHER',
} as const;

export type FraudFlagReason = (typeof FraudFlagReason)[keyof typeof FraudFlagReason];

export interface TrustScoreBreakdownItem {
  code: string;
  label: string;
  points: number;
  maxPoints: number;
}

export interface BusinessTrustScoreView {
  score: number;
  breakdown: TrustScoreBreakdownItem[];
  computedAt: string;
}

/** Satıcı işletme kapsamlı CRM müşterisi (tenant = businessId). */
export interface CrmCustomerDraft {
  tenantId: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  source?: CrmCustomerSource;
  tags?: string[];
}

export interface CrmCustomerRow {
  id: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  userId?: string | null;
  source: CrmCustomerSource;
  tags: string[];
  lastContactAt?: string | null;
  nextAction?: string | null;
  lifetimeValueMinor: number;
  createdAt: string;
  updatedAt: string;
  _count: { workOrders: number };
}

export interface CrmCustomerDetail extends CrmCustomerRow {
  notesList: Array<{ id: string; body: string; createdAt: string; fileAssetId?: string | null }>;
  followUps: Array<{
    id: string;
    dueAt: string;
    body: string;
    completedAt?: string | null;
  }>;
  workOrders: Array<{
    id: string;
    title: string;
    stage: WorkOrderStage;
    source: WorkOrderSource;
    createdAt: string;
  }>;
}

export interface WorkOrderDraft {
  tenantId: string;
  customerId: string;
  source: WorkOrderSource;
  stage: WorkOrderStage;
  title: string;
  /** Marketplace köprüsü; yoksa dış iş. */
  marketplaceOrderId?: string | null;
}

export interface WorkOrderRow {
  id: string;
  tenantId: string;
  customerId: string;
  source: WorkOrderSource;
  stage: WorkOrderStage;
  title: string;
  notes?: string | null;
  scheduledAt?: string | null;
  assignedUserId?: string | null;
  marketplaceOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; displayName: string } | null;
}

export interface BusinessTaskRow {
  id: string;
  tenantId: string;
  workOrderId?: string | null;
  assigneeUserId?: string | null;
  title: string;
  status: BusinessTaskStatus;
  priority: BusinessTaskPriority;
  dueAt?: string | null;
  createdAt: string;
}

export interface BusinessDashboardV2 {
  todayJobs: number;
  upcomingJobs: number;
  pendingOffers: number;
  pendingPayments: number;
  openRequests: number;
  leadCount: number;
  conversionRate: number | null;
  revenueMinor: number;
  currency: string;
  social: {
    postCount: number;
    totalViews: number;
    totalLikes: number;
    dealPostCount: number;
  };
}

export interface CampaignRow {
  id: string;
  businessId: string;
  title: string;
  description?: string | null;
  audience: CampaignAudience;
  status: CampaignStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  impressionCount: number;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
}
