import {
  AGENT_TOOL_KIND,
  AGENT_TOOL_NAMES,
  type AgentToolKind,
  type AgentToolName,
} from '@talpio/types';

export interface AgentToolDefinition {
  name: AgentToolName;
  kind: AgentToolKind;
  description: string;
}

/** Allowlist — registry dışı tool adı reddedilir. */
export const AGENT_TOOL_REGISTRY: Record<AgentToolName, AgentToolDefinition> = {
  [AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE]: {
    name: AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Bugünkü planlı / başlayan işler',
  },
  [AGENT_TOOL_NAMES.GET_TOMORROW_SCHEDULE]: {
    name: AGENT_TOOL_NAMES.GET_TOMORROW_SCHEDULE,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Yarınki planlı işler',
  },
  [AGENT_TOOL_NAMES.GET_PENDING_OFFERS]: {
    name: AGENT_TOOL_NAMES.GET_PENDING_OFFERS,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Bekleyen teklifler',
  },
  [AGENT_TOOL_NAMES.GET_PENDING_PAYMENTS]: {
    name: AGENT_TOOL_NAMES.GET_PENDING_PAYMENTS,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Ödeme bekleyen siparişler',
  },
  [AGENT_TOOL_NAMES.GET_ACTIVE_ORDERS]: {
    name: AGENT_TOOL_NAMES.GET_ACTIVE_ORDERS,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Aktif siparişler',
  },
  [AGENT_TOOL_NAMES.GET_RECENT_NOTIFICATIONS]: {
    name: AGENT_TOOL_NAMES.GET_RECENT_NOTIFICATIONS,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Son bildirimler',
  },
  [AGENT_TOOL_NAMES.GET_MONTHLY_REVENUE_SUMMARY]: {
    name: AGENT_TOOL_NAMES.GET_MONTHLY_REVENUE_SUMMARY,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Bu ay tahsil edilen ciro (deterministic)',
  },
  [AGENT_TOOL_NAMES.SEARCH_CUSTOMER_OR_ORDER]: {
    name: AGENT_TOOL_NAMES.SEARCH_CUSTOMER_OR_ORDER,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Müşteri veya sipariş ara',
  },
  [AGENT_TOOL_NAMES.GET_OPEN_REQUESTS]: {
    name: AGENT_TOOL_NAMES.GET_OPEN_REQUESTS,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Açık tedarik talepleri',
  },
  [AGENT_TOOL_NAMES.GET_RECENT_CUSTOMERS]: {
    name: AGENT_TOOL_NAMES.GET_RECENT_CUSTOMERS,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Son CRM müşterileri',
  },
  [AGENT_TOOL_NAMES.GET_SOCIAL_PERFORMANCE]: {
    name: AGENT_TOOL_NAMES.GET_SOCIAL_PERFORMANCE,
    kind: AGENT_TOOL_KIND.READ,
    description: 'Sosyal performans özeti',
  },
  [AGENT_TOOL_NAMES.SEARCH_WORK_ORDER]: {
    name: AGENT_TOOL_NAMES.SEARCH_WORK_ORDER,
    kind: AGENT_TOOL_KIND.READ,
    description: 'İş emri ara',
  },
  [AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT]: {
    name: AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT,
    kind: AGENT_TOOL_KIND.WRITE,
    description: 'Hatırlatma taslağı (onay gerekir)',
  },
  [AGENT_TOOL_NAMES.CREATE_OFFER_DRAFT]: {
    name: AGENT_TOOL_NAMES.CREATE_OFFER_DRAFT,
    kind: AGENT_TOOL_KIND.WRITE,
    description: 'Teklif taslağı (onay gerekir; fiyat hesaplamaz)',
  },
  [AGENT_TOOL_NAMES.CREATE_CAMPAIGN_DRAFT]: {
    name: AGENT_TOOL_NAMES.CREATE_CAMPAIGN_DRAFT,
    kind: AGENT_TOOL_KIND.WRITE,
    description: 'Kampanya taslağı (onay gerekir)',
  },
};

export function isAllowedToolName(name: string): name is AgentToolName {
  return Object.prototype.hasOwnProperty.call(AGENT_TOOL_REGISTRY, name);
}

export function toolDefinitionsForAi(): Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}> {
  return Object.values(AGENT_TOOL_REGISTRY).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: { type: 'object', properties: {} },
  }));
}
