import { Injectable, Logger } from '@nestjs/common';
import type { AuditLogEntry } from '@ustapilot/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import type { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@infra/prisma/prisma.service';

import type { ListAuditLogsQueryDto } from './dto/admin-query.dto';

export interface AuditEntryInput {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yönetim işlemini kaydeder.
   *
   * Kayıt başarısız olsa bile çağıran işlem geri alınmaz: denetim izi
   * önemlidir ama bir hesabın askıya alınmasını engellemesi daha kötü olurdu.
   * Bu yüzden hata yükseltilmez, yalnızca loglanır.
   */
  async record(input: AuditEntryInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          // Serbest biçimli özet; Prisma'nın JSON girdi tipine yalnızca burada
          // daraltılır, çağıranlar düz nesne geçebilsin.
          changes: (input.changes ?? undefined) as Prisma.InputJsonValue | undefined,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.error({ err: error, action: input.action }, 'Denetim kaydı yazılamadı');
    }
  }

  async list(query: ListAuditLogsQueryDto): Promise<PaginatedResult<AuditLogEntry>> {
    const where = {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { fullName: true } } },
        orderBy: query.toOrderBy(['createdAt']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        actorName: row.actor?.fullName ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        changes: (row.changes as Record<string, unknown> | null) ?? null,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      query.page,
      query.limit,
    );
  }
}
