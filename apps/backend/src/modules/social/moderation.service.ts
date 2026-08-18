import { Injectable } from '@nestjs/common';
import { ContentReportStatus, type ContentReport } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { CreateContentReportDto } from './dto/social.dto';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async report(user: AuthenticatedUser, dto: CreateContentReportDto): Promise<ContentReport> {
    const existing = await this.prisma.contentReport.findFirst({
      where: {
        reporterUserId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: { in: [ContentReportStatus.OPEN, ContentReportStatus.REVIEWING] },
      },
    });
    if (existing) {
      return {
        id: existing.id,
        reporterUserId: existing.reporterUserId,
        targetType: existing.targetType,
        targetId: existing.targetId,
        reason: existing.reason,
        status: existing.status,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const created = await this.prisma.contentReport.create({
      data: {
        reporterUserId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason.trim(),
        status: ContentReportStatus.OPEN,
      },
    });

    await this.audit.record({
      actorId: user.id,
      action: 'social.report',
      entityType: dto.targetType,
      entityId: dto.targetId,
      changes: { reason: dto.reason, reportId: created.id },
    });

    return {
      id: created.id,
      reporterUserId: created.reporterUserId,
      targetType: created.targetType,
      targetId: created.targetId,
      reason: created.reason,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async block(user: AuthenticatedUser, blockedUserId: string): Promise<void> {
    if (user.id === blockedUserId) {
      throw new AppException('VALIDATION_ERROR', { message: 'Kendinizi engelleyemezsiniz.' });
    }

    const target = await this.prisma.user.findFirst({
      where: { id: blockedUserId, deletedAt: null },
      select: { id: true },
    });
    if (!target) throw AppException.notFound('Kullanıcı', blockedUserId);

    await this.prisma.userBlock.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: user.id,
          blockedUserId,
        },
      },
      update: {},
      create: { blockerUserId: user.id, blockedUserId },
    });

    await this.audit.record({
      actorId: user.id,
      action: 'social.block',
      entityType: 'USER',
      entityId: blockedUserId,
    });
  }

  async unblock(user: AuthenticatedUser, blockedUserId: string): Promise<void> {
    await this.prisma.userBlock.deleteMany({
      where: { blockerUserId: user.id, blockedUserId },
    });

    await this.audit.record({
      actorId: user.id,
      action: 'social.unblock',
      entityType: 'USER',
      entityId: blockedUserId,
    });
  }
}
