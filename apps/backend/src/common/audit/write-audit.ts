import { Logger } from '@nestjs/common';

import type { Prisma, PrismaClient } from '@/generated/prisma/client';

const logger = new Logger('WriteAudit');

export async function writeAudit(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: (input.changes ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    logger.error({ err: error, action: input.action }, 'Denetim kaydı yazılamadı');
  }
}
