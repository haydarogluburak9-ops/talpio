import type { BaseEntity } from './models/common';

/** Allowlist — Agent yalnızca bu adları çağırabilir. */
export const AGENT_TOOL_NAMES = {
  GET_TODAY_SCHEDULE: 'getTodaySchedule',
  GET_TOMORROW_SCHEDULE: 'getTomorrowSchedule',
  GET_PENDING_OFFERS: 'getPendingOffers',
  GET_PENDING_PAYMENTS: 'getPendingPayments',
  GET_ACTIVE_ORDERS: 'getActiveOrders',
  GET_RECENT_NOTIFICATIONS: 'getRecentNotifications',
  GET_MONTHLY_REVENUE_SUMMARY: 'getMonthlyRevenueSummary',
  SEARCH_CUSTOMER_OR_ORDER: 'searchCustomerOrOrder',
  GET_OPEN_REQUESTS: 'getOpenRequests',
  GET_RECENT_CUSTOMERS: 'getRecentCustomers',
  GET_SOCIAL_PERFORMANCE: 'getSocialPerformance',
  SEARCH_WORK_ORDER: 'searchWorkOrder',
  CREATE_REMINDER_DRAFT: 'createReminderDraft',
  CREATE_OFFER_DRAFT: 'createOfferDraft',
  CREATE_CAMPAIGN_DRAFT: 'createCampaignDraft',
} as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[keyof typeof AGENT_TOOL_NAMES];

export const AGENT_TOOL_KIND = {
  READ: 'READ',
  WRITE: 'WRITE',
} as const;

export type AgentToolKind = (typeof AGENT_TOOL_KIND)[keyof typeof AGENT_TOOL_KIND];

export const AgentMessageRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  TOOL: 'TOOL',
  SYSTEM: 'SYSTEM',
} as const;

export type AgentMessageRole = (typeof AgentMessageRole)[keyof typeof AgentMessageRole];

export const AgentActionStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXECUTED: 'EXECUTED',
  FAILED: 'FAILED',
} as const;

export type AgentActionStatus = (typeof AgentActionStatus)[keyof typeof AgentActionStatus];

export interface AgentThread extends BaseEntity {
  tenantId: string;
  userId: string;
  title?: string | null;
}

export interface AgentMessage {
  id: string;
  threadId: string;
  role: AgentMessageRole;
  content: string;
  /** Tool çağrıları veya yapılandırılmış ekler. */
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AgentActionProposal {
  id: string;
  threadId: string;
  tenantId: string;
  userId: string;
  toolName: AgentToolName;
  /** Onay ekranında gösterilecek insan dilinde özet. */
  summary: string;
  input: Record<string, unknown>;
  status: AgentActionStatus;
  createdAt: string;
  decidedAt?: string | null;
}

export interface AgentChatResponse {
  thread: AgentThread;
  messages: AgentMessage[];
  /** Onay bekleyen yazma aksiyonları. */
  pendingActions: AgentActionProposal[];
}

export interface MonthlyRevenueSummary {
  year: number;
  month: number;
  /** Kuruş; LLM hesaplamaz, backend verir. */
  collectedMinor: number;
  pendingMinor: number;
  currency: string;
  orderCount: number;
}
