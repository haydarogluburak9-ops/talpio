/**
 * Transactional outbox event sözleşmeleri.
 *
 * Domain işlemi ile aynı transaction'da yazılır; publisher BullMQ'ya aktarır.
 */

export const DOMAIN_EVENT_TYPES = {
  ORDER_CREATED: 'order.created',
  /** İleride ERP WorkOrder köprüsü bu olayı dinler. */
  WORK_ORDER_BRIDGE_REQUESTED: 'work_order.bridge_requested',
  REQUEST_MATCHED: 'request.matched',
  REMINDER_CREATED: 'reminder.created',
  AGENT_ACTION_APPROVED: 'agent.action_approved',
} as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export interface DomainEventEnvelope<TPayload = object> {
  type: DomainEventType;
  /** Aynı aggregate + type + key kombinasyonu yeniden yayınlanmaz. */
  idempotencyKey: string;
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  occurredAt: string;
}

/** Marketplace Order oluşunca yazılır; WorkOrder henüz yokken köprü hazırlığıdır. */
export interface OrderCreatedEventPayload {
  orderId: string;
  jobRequestId?: string | null;
  customerId: string;
  providerProfileId: string;
  totalMinor: number;
  currency: string;
}

export interface WorkOrderBridgeRequestedPayload {
  orderId: string;
  providerProfileId: string;
  customerId: string;
  source: 'TALPIO';
}

/** CommerceRequest yayınlanınca eşleşen satıcı üyesine gider. */
export interface RequestMatchedEventPayload {
  requestId: string;
  businessId: string;
  userId: string;
  requestTitle: string;
  categoryName: string;
  cityName: string;
  shortDescription: string;
  deadline: string;
  matchScore: number;
}
