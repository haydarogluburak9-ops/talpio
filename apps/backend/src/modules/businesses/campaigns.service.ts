import { Injectable } from '@nestjs/common';
import {
  CampaignAudience,
  CampaignStatus,
  type CampaignRow,
} from '@talpio/types';

import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { RbacService } from '@modules/rbac/rbac.service';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly audit: AuditLogService,
  ) {}

  async list(user: AuthenticatedUser, businessId: string): Promise<CampaignRow[]> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const rows = await this.prisma.b2bCampaign.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(toCampaignRow);
  }

  async create(
    user: AuthenticatedUser,
    businessId: string,
    dto: {
      title: string;
      description?: string | null;
      audience?: CampaignAudience;
      status?: CampaignStatus;
      categoryId?: string | null;
      startsAt?: string | null;
      endsAt?: string | null;
      postIds?: string[];
    },
  ): Promise<CampaignRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const status = dto.status ?? CampaignStatus.DRAFT;
    const row = await this.prisma.b2bCampaign.create({
      data: {
        businessId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        body: dto.description?.trim() || null,
        audience: dto.audience ?? CampaignAudience.PUBLIC,
        status,
        categoryId: dto.categoryId ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: status === CampaignStatus.ACTIVE,
        posts: dto.postIds?.length
          ? { create: dto.postIds.map((postId) => ({ postId })) }
          : undefined,
      },
    });
    await this.audit.record({
      actorId: user.id,
      action: 'campaign.create',
      entityType: 'B2bCampaign',
      entityId: row.id,
      changes: { businessId, audience: row.audience },
    });
    return toCampaignRow(row);
  }
}

function toCampaignRow(row: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  audience: CampaignAudience;
  status: CampaignStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  impressionCount: number;
  clickCount: number;
  conversionCount: number;
  createdAt: Date;
}): CampaignRow {
  return {
    id: row.id,
    businessId: row.businessId,
    title: row.title,
    description: row.description,
    audience: row.audience,
    status: row.status,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    isActive: row.isActive,
    impressionCount: row.impressionCount,
    clickCount: row.clickCount,
    conversionCount: row.conversionCount,
    createdAt: row.createdAt.toISOString(),
  };
}
