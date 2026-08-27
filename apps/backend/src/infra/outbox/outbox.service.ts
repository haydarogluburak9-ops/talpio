import { Injectable } from '@nestjs/common';
import type { DomainEventEnvelope } from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';

/** Transaction içinde outbox satırı yazar; aynı idempotencyKey ikinci kez yazılmaz. */
@Injectable()
export class OutboxService {
  async write(
    tx: Prisma.TransactionClient,
    event: DomainEventEnvelope,
  ): Promise<{ id: string; created: boolean }> {
    try {
      const row = await tx.outboxEvent.create({
        data: {
          type: event.type,
          idempotencyKey: event.idempotencyKey,
          tenantId: event.tenantId,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          status: 'PENDING',
        },
        select: { id: true },
      });
      return { id: row.id, created: true };
    } catch (error) {
      // Unique(idempotencyKey) — aynı olay ikinci kez yazılmaz.
      if (this.isUniqueViolation(error)) {
        const existing = await tx.outboxEvent.findUnique({
          where: { idempotencyKey: event.idempotencyKey },
          select: { id: true },
        });
        return { id: existing?.id ?? '', created: false };
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
