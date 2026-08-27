import { Injectable } from '@nestjs/common';
import { computeTrustScore, type TrustScoreSignals } from '@talpio/business-logic';
import {
  DocumentStatus,
  OrderStatus,
  PaymentStatus,
  VerificationStatus,
  type BusinessTrustScoreView,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { writeAudit } from '@common/audit/write-audit';
import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { RbacService } from '@modules/rbac/rbac.service';

import { ratioPercent } from '@modules/social/business-profile.stats';

@Injectable()
export class TrustScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async getOrCompute(businessId: string): Promise<BusinessTrustScoreView> {
    const existing = await this.prisma.businessTrustScore.findUnique({
      where: { businessId },
    });
    if (existing && Date.now() - existing.computedAt.getTime() < 10 * 60 * 1000) {
      return this.toView(existing);
    }
    return this.recompute(businessId);
  }

  async recomputeForUser(
    user: AuthenticatedUser,
    businessId: string,
  ): Promise<BusinessTrustScoreView> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    return this.recompute(businessId);
  }

  async recompute(businessId: string): Promise<BusinessTrustScoreView> {
    const signals = await this.collectSignals(businessId);
    const result = computeTrustScore(signals);
    const row = await this.prisma.businessTrustScore.upsert({
      where: { businessId },
      create: {
        businessId,
        score: result.score,
        breakdown: result.breakdown as unknown as Prisma.InputJsonValue,
        computedAt: new Date(),
      },
      update: {
        score: result.score,
        breakdown: result.breakdown as unknown as Prisma.InputJsonValue,
        computedAt: new Date(),
      },
    });
    void writeAudit(this.prisma, {
      action: 'trust_score.recompute',
      entityType: 'Business',
      entityId: businessId,
      changes: { score: result.score },
    });
    return this.toView(row);
  }

  private toView(row: {
    score: number;
    breakdown: unknown;
    computedAt: Date;
  }): BusinessTrustScoreView {
    return {
      score: row.score,
      breakdown: Array.isArray(row.breakdown)
        ? (row.breakdown as BusinessTrustScoreView['breakdown'])
        : [],
      computedAt: row.computedAt.toISOString(),
    };
  }

  private async collectSignals(businessId: string): Promise<TrustScoreSignals> {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        verificationStatus: true,
        ownerUserId: true,
        providerProfileId: true,
        localeSettings: { select: { taxId: true } },
        socialProfile: { select: { id: true } },
        providerProfile: {
          select: {
            id: true,
            verificationStatus: true,
            averageRating: true,
            reviewCount: true,
            user: { select: { emailVerifiedAt: true, phoneVerifiedAt: true } },
            documents: {
              where: { status: DocumentStatus.APPROVED, deletedAt: null },
              select: { id: true },
            },
          },
        },
      },
    });
    if (!business) throw AppException.notFound('İşletme', businessId);

    const owner = await this.prisma.user.findUnique({
      where: { id: business.ownerUserId },
      select: { emailVerifiedAt: true, phoneVerifiedAt: true },
    });

    const providerId = business.providerProfile?.id ?? business.providerProfileId;
    const profileId = business.socialProfile?.id;

    const [
      completedOrders,
      cancelledOrders,
      notifiedMatches,
      offerTotal,
      refunds,
      payments,
      complaints,
      reports,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.COMPLETED,
          OR: [
            ...(providerId ? [{ providerProfileId: providerId }] : []),
            { requestOrderLink: { requestOffer: { businessId } } },
          ],
        },
      }),
      this.prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.CANCELLED,
          OR: [
            ...(providerId ? [{ providerProfileId: providerId }] : []),
            { requestOrderLink: { requestOffer: { businessId } } },
          ],
        },
      }),
      this.prisma.requestMatch.count({
        where: { businessId, notifiedAt: { not: null } },
      }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null },
      }),
      this.prisma.payment.count({
        where: {
          status: PaymentStatus.REFUNDED,
          order: {
            deletedAt: null,
            OR: [
              ...(providerId ? [{ providerProfileId: providerId }] : []),
              { requestOrderLink: { requestOffer: { businessId } } },
            ],
          },
        },
      }),
      this.prisma.payment.count({
        where: {
          order: {
            deletedAt: null,
            OR: [
              ...(providerId ? [{ providerProfileId: providerId }] : []),
              { requestOrderLink: { requestOffer: { businessId } } },
            ],
          },
        },
      }),
      providerId
        ? this.prisma.complaint.count({
            where: { deletedAt: null, subjectId: providerId },
          })
        : Promise.resolve(0),
      profileId
        ? this.prisma.contentReport.count({
            where: { targetId: profileId },
          })
        : Promise.resolve(0),
    ]);

    const identityVerified = Boolean(
      owner?.emailVerifiedAt ||
      owner?.phoneVerifiedAt ||
      business.providerProfile?.user.emailVerifiedAt ||
      business.providerProfile?.user.phoneVerifiedAt,
    );

    const rating = business.providerProfile?.averageRating;
    const reviewScore =
      rating == null ? null : Number.isFinite(Number(rating)) ? Number(rating) : null;

    return {
      identityVerified,
      businessVerified:
        business.verificationStatus === VerificationStatus.VERIFIED ||
        business.providerProfile?.verificationStatus === VerificationStatus.VERIFIED,
      taxVerified: Boolean(business.localeSettings?.taxId?.trim()),
      approvedDocumentCount: business.providerProfile?.documents.length ?? 0,
      successfulOrderCount: completedOrders,
      reviewScore,
      reviewCount: business.providerProfile?.reviewCount ?? 0,
      complaintCount: complaints,
      refundCount: refunds,
      paymentCount: payments,
      responseRatePercent: ratioPercent(offerTotal, notifiedMatches),
      accountAgeDays: Math.max(
        0,
        Math.floor((Date.now() - business.createdAt.getTime()) / 86_400_000),
      ),
      cancelledOrderCount: cancelledOrders,
      contentReportCount: reports,
    };
  }
}
