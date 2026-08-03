import { canTransitionJobStatus } from '@ustapilot/business-logic';
import { JobRequestStatus, OrderStatus } from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';

/**
 * Siparişin durumu ile işin durumu birlikte ilerler. İş akışı müşteri ve usta
 * ekranlarında talep üzerinden okunduğu için ikisi ayrı düşmemelidir.
 */
const JOB_STATUS_FOR_ORDER: Partial<Record<OrderStatus, JobRequestStatus>> = {
  [OrderStatus.PAID]: JobRequestStatus.SCHEDULED,
  [OrderStatus.IN_PROGRESS]: JobRequestStatus.IN_PROGRESS,
  [OrderStatus.AWAITING_APPROVAL]: JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
  [OrderStatus.COMPLETED]: JobRequestStatus.COMPLETED,
  [OrderStatus.CANCELLED]: JobRequestStatus.CANCELLED,
  [OrderStatus.REFUNDED]: JobRequestStatus.CANCELLED,
};

/** Siparişten işe eşleme için gereken en küçük alan kümesi. */
export interface JobStatusSource {
  jobRequestId: string;
  jobStatus: JobRequestStatus;
}

/**
 * İşin durumunu siparişle aynı hizaya çeker.
 *
 * Geçiş tablosu izin vermiyorsa iş durumu olduğu gibi bırakılır; sipariş
 * akışı bir veri tutarsızlığı yüzünden kilitlenmemelidir.
 */
export async function syncJobStatus(
  tx: Prisma.TransactionClient,
  source: JobStatusSource,
  orderStatus: OrderStatus,
  userId: string,
  note: string,
): Promise<void> {
  const target = JOB_STATUS_FOR_ORDER[orderStatus];
  if (!target) return;

  const from = source.jobStatus;
  if (from === target) return;
  if (!canTransitionJobStatus(from, target)) return;

  await tx.jobRequest.update({ where: { id: source.jobRequestId }, data: { status: target } });

  await tx.jobStatusHistory.create({
    data: {
      jobRequestId: source.jobRequestId,
      fromStatus: from,
      toStatus: target,
      changedByUserId: userId,
      note,
    },
  });
}
