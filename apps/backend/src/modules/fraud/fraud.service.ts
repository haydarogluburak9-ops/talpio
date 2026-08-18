import { Injectable, Logger } from '@nestjs/common';
import { FRAUD_VOLUME_THRESHOLDS, shouldFlagVolume } from '@talpio/business-logic';
import { FraudFlagReason, FraudFlagStatus } from '@talpio/types';

import { PrismaService } from '@infra/prisma/prisma.service';

const DEDUPE_MS = 24 * 60 * 60 * 1000;

/**
 * Şüpheli hacmi işaretler; otomatik ban uygulamaz.
 * Hata yutulur — ticaret akışı bayrak yazımı yüzünden kırılmaz.
 */
@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private readonly prisma: PrismaService) {}

  observeRequests(userId: string, subjectId: string): void {
    void this.observe(userId, FraudFlagReason.MANY_REQUESTS, 'request', subjectId);
  }

  observeOffers(userId: string, subjectId: string): void {
    void this.observe(userId, FraudFlagReason.MANY_OFFERS, 'offer', subjectId);
  }

  observeMessages(userId: string, subjectId: string): void {
    void this.observe(userId, FraudFlagReason.SPAM_MESSAGES, 'message', subjectId);
  }

  async observe(
    userId: string,
    reason: FraudFlagReason,
    subjectType: string,
    subjectId: string,
  ): Promise<void> {
    try {
      const threshold =
        reason === FraudFlagReason.MANY_REQUESTS ||
        reason === FraudFlagReason.MANY_OFFERS ||
        reason === FraudFlagReason.SPAM_MESSAGES
          ? FRAUD_VOLUME_THRESHOLDS[reason]
          : undefined;
      if (threshold === undefined) return;

      const since = new Date(Date.now() - 60 * 60 * 1000);
      const count = await this.countInWindow(userId, reason, since);
      if (!shouldFlagVolume(count, threshold)) return;

      const recent = await this.prisma.fraudFlag.findFirst({
        where: {
          userId,
          reason,
          status: { in: [FraudFlagStatus.OPEN, FraudFlagStatus.REVIEWING] },
          createdAt: { gte: new Date(Date.now() - DEDUPE_MS) },
        },
        select: { id: true },
      });
      if (recent) return;

      await this.prisma.fraudFlag.create({
        data: {
          userId,
          subjectType,
          subjectId,
          reason,
          status: FraudFlagStatus.OPEN,
          note: `Saatlik hacim ${count} (eşik ${threshold}). Otomatik yasak yok.`,
        },
      });
    } catch (error) {
      this.logger.warn({ err: error, userId, reason }, 'Fraud bayrağı yazılamadı');
    }
  }

  private async countInWindow(
    userId: string,
    reason: FraudFlagReason,
    since: Date,
  ): Promise<number> {
    if (reason === FraudFlagReason.MANY_REQUESTS) {
      const [jobs, commerce] = await Promise.all([
        this.prisma.jobRequest.count({ where: { customerId: userId, createdAt: { gte: since } } }),
        this.prisma.commerceRequest.count({
          where: { buyerUserId: userId, createdAt: { gte: since } },
        }),
      ]);
      return jobs + commerce;
    }

    if (reason === FraudFlagReason.MANY_OFFERS) {
      const [jobOffers, requestOffers] = await Promise.all([
        this.prisma.offer.count({
          where: { providerProfile: { userId }, createdAt: { gte: since } },
        }),
        this.prisma.requestOffer.count({
          where: { createdByUserId: userId, createdAt: { gte: since } },
        }),
      ]);
      return jobOffers + requestOffers;
    }

    return this.prisma.message.count({
      where: { senderId: userId, createdAt: { gte: since } },
    });
  }
}
