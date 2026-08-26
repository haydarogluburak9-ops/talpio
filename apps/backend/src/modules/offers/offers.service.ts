import { Injectable, Optional } from '@nestjs/common';
import {
  calculateCommission,
  canAcceptOffer,
  canSubmitOffer,
  selectCommissionRule,
  type OfferEligibility,
} from '@talpio/business-logic';
import { deepLinks } from '@talpio/config';
import {
  DOMAIN_EVENT_TYPES,
  JobRequestStatus,
  NotificationType,
  OfferStatus,
  OrderStatus,
  UserRole,
  type CommissionRule,
  type Offer,
  type OrderCreatedEventPayload,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import type { ErrorCode } from '@common/errors/error-codes';
import { AppConfigService } from '@config/app-config.service';
import { OutboxService } from '@infra/outbox/outbox.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FraudService } from '@modules/fraud/fraud.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type { AcceptOfferDto, CreateOfferDto } from './dto/create-offer.dto';
import type { ListJobOffersQueryDto, ListMyOffersQueryDto } from './dto/list-offers-query.dto';
import { offerInclude, toOffer, type OfferRow } from './offer.mapper';

const SORTABLE_FIELDS = ['createdAt', 'amountMinor', 'validUntil'] as const;

/**
 * Teklif verme engellerinin kullanıcıya dönecek karşılıkları. İş kuralı
 * `canSubmitOffer` içinde tek yerde tanımlıdır; burada yalnızca sunuma çevrilir.
 */
const ELIGIBILITY_ERRORS: Record<
  NonNullable<OfferEligibility['reason']>,
  { code: ErrorCode; message: string }
> = {
  NOT_PROVIDER: {
    code: 'PROVIDER_PROFILE_INCOMPLETE',
    message: 'Teklif vermek için satıcı profiliniz olmalıdır.',
  },
  PROFILE_INCOMPLETE: {
    code: 'PROVIDER_PROFILE_INCOMPLETE',
    message: 'Teklif vermeden önce hizmet ve bölge bilgilerinizi tamamlayın.',
  },
  NOT_VERIFIED: {
    code: 'PROVIDER_NOT_VERIFIED',
    message: 'Teklif verebilmek için hesabınızın doğrulanmış olması gerekir.',
  },
  JOB_NOT_OPEN: {
    code: 'JOB_NOT_OPEN_FOR_OFFERS',
    message: 'Bu talep artık teklife kapalı.',
  },
  OUT_OF_SERVICE_AREA: {
    code: 'PROVIDER_OUT_OF_SERVICE_AREA',
    message: 'Bu talep hizmet verdiğiniz bölgelerin dışında.',
  },
  CATEGORY_MISMATCH: {
    code: 'PROVIDER_OUT_OF_SERVICE_AREA',
    message: 'Bu talep verdiğiniz hizmet kategorilerinin dışında.',
  },
  DUPLICATE_OFFER: {
    code: 'DUPLICATE_OFFER',
    message: 'Bu talebe zaten teklif verdiniz.',
  },
};

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
    private readonly outbox: OutboxService,
    @Optional() private readonly fraud?: FraudService,
  ) {}

  /**
   * Satıcı bir talebe teklif verir.
   *
   * Uygunluk kontrolü ile kaydın yazılması tek işlemde yapılır; ayrıca
   * `(jobRequestId, providerProfileId)` benzersizliği veritabanında zorunludur;
   * böylece eşzamanlı iki istek çift teklif oluşturamaz.
   */
  async create(user: AuthenticatedUser, dto: CreateOfferDto): Promise<Offer> {
    const profile = await this.requireProviderProfile(user.id);

    const job = await this.prisma.jobRequest.findFirst({
      where: { id: dto.jobRequestId, deletedAt: null },
      select: {
        id: true,
        title: true,
        customerId: true,
        status: true,
        categoryId: true,
        districtId: true,
        currency: true,
        expiresAt: true,
      },
    });

    if (!job) throw AppException.notFound('İş talebi', dto.jobRequestId);

    const existing = await this.prisma.offer.findFirst({
      where: { jobRequestId: job.id, providerProfileId: profile.id, deletedAt: null },
      select: { id: true },
    });

    const eligibility = canSubmitOffer({
      actor: { userId: user.id, role: user.role, providerProfileId: profile.id },
      jobStatus: job.status,
      jobCategoryId: job.categoryId,
      jobDistrictId: job.districtId,
      providerIsVerified: profile.isVerified,
      providerCategoryIds: profile.services.map((service) => service.categoryId),
      providerDistrictIds: profile.serviceAreas.map((area) => area.districtId),
      hasExistingOffer: existing !== null,
    });

    if (!eligibility.allowed) {
      const failure = ELIGIBILITY_ERRORS[eligibility.reason ?? 'NOT_PROVIDER'];
      throw new AppException(failure.code, { message: failure.message });
    }

    // Süresi dolmuş bir talebe teklif verilmesi teklifin daha doğduğu an
    // geçersiz olması demektir; durum alanı henüz güncellenmemiş olabilir.
    if (job.expiresAt && job.expiresAt.getTime() <= Date.now()) {
      throw new AppException('JOB_NOT_OPEN_FOR_OFFERS', {
        message: 'Bu talebin süresi dolmuş.',
      });
    }

    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.create({
        data: {
          jobRequestId: job.id,
          providerProfileId: profile.id,
          status: OfferStatus.SUBMITTED,
          amountMinor: dto.amountMinor,
          currency: job.currency,
          priceType: dto.priceType,
          estimatedDurationMinutes: dto.estimatedDurationMinutes ?? null,
          availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
          materialsIncluded: dto.materialsIncluded,
          note: dto.note ?? null,
          validUntil: new Date(now.getTime() + dto.validityHours * 60 * 60 * 1000),
          submittedAt: now,
        },
        include: offerInclude,
      });

      // İlk teklifle birlikte talep "teklifler alındı" durumuna geçer; sayaç
      // her teklifte artar ve listelerde ek sorgu yapılmadan gösterilir.
      await tx.jobRequest.update({
        where: { id: job.id },
        data: {
          offerCount: { increment: 1 },
          ...(job.status === JobRequestStatus.PUBLISHED
            ? { status: JobRequestStatus.OFFERS_RECEIVED }
            : {}),
        },
      });

      if (job.status === JobRequestStatus.PUBLISHED) {
        await tx.jobStatusHistory.create({
          data: {
            jobRequestId: job.id,
            fromStatus: JobRequestStatus.PUBLISHED,
            toStatus: JobRequestStatus.OFFERS_RECEIVED,
            changedByUserId: user.id,
            note: 'İlk teklif alındı',
          },
        });
      }

      return offer;
    });

    const offer = this.present(created);

    await this.notifications.dispatch({
      userId: job.customerId,
      type: NotificationType.OFFER_RECEIVED,
      params: {
        jobTitle: job.title,
        providerName: offer.provider?.displayName ?? 'Satıcı',
        amountMinor: offer.price.amountMinor,
        currency: offer.price.currency,
      },
      deepLink: deepLinks.jobOffers(job.id),
    });
    this.fraud?.observeOffers(user.id, offer.id);

    return offer;
  }

  /** Satıcının kendi verdiği teklifler. */
  async listMine(
    user: AuthenticatedUser,
    query: ListMyOffersQueryDto,
  ): Promise<PaginatedResult<Offer>> {
    const profile = await this.requireProviderProfile(user.id);

    const where: Prisma.OfferWhereInput = {
      providerProfileId: profile.id,
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
    };

    return this.paginate(
      where,
      query.toOrderBy(SORTABLE_FIELDS),
      query.skip,
      query.limit,
      query.page,
    );
  }

  /** Bir talebe gelen teklifler. Yalnızca talep sahibi ve personel görebilir. */
  async listForJob(
    user: AuthenticatedUser,
    jobId: string,
    query: ListJobOffersQueryDto,
  ): Promise<PaginatedResult<Offer>> {
    await this.requireJobVisibleToCustomer(user, jobId);

    const where: Prisma.OfferWhereInput = {
      jobRequestId: jobId,
      deletedAt: null,
      // Taslak teklifler satıcının kendi kaydıdır; müşteriye gösterilmez.
      status: query.status?.length ? { in: query.status } : { not: OfferStatus.DRAFT },
    };

    return this.paginate(
      where,
      query.toOrderBy(SORTABLE_FIELDS, { createdAt: 'asc' }),
      query.skip,
      query.limit,
      query.page,
    );
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Offer> {
    const row = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
      include: { ...offerInclude, jobRequest: { select: { customerId: true } } },
    });

    if (!row) throw AppException.notFound('Teklif', id);

    if (this.isStaff(user.role)) return this.present(row);
    if (row.jobRequest.customerId === user.id) return this.present(row);

    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (profile && row.providerProfileId === profile.id) return this.present(row);

    throw AppException.forbiddenResource('Teklif', { offerId: id });
  }

  /**
   * Müşteri teklifi kabul eder.
   *
   * Tek işlemde: teklif kabul edilir, rakip teklifler reddedilir, talep satıcı
   * seçildi durumuna geçer ve komisyonu dondurulmuş bir sipariş açılır.
   * Komisyon kabul anındaki kuralla hesaplanıp saklanır; kural sonradan
   * değişse bile taraflar arasında anlaşılan tutar değişmez.
   */
  async accept(user: AuthenticatedUser, id: string, dto: AcceptOfferDto): Promise<Offer> {
    const row = await this.requireOfferOnOwnJob(user, id);

    if (row.status !== OfferStatus.SUBMITTED) {
      throw new AppException('OFFER_NOT_PENDING', {
        message: 'Yalnızca bekleyen teklifler kabul edilebilir.',
        context: { status: row.status },
      });
    }

    if (row.validUntil.getTime() <= Date.now()) {
      throw new AppException('OFFER_EXPIRED', {
        message: 'Bu teklifin geçerlilik süresi dolmuş.',
      });
    }

    if (
      !canAcceptOffer({
        offerStatus: row.status,
        jobStatus: row.jobRequest.status,
        validUntil: row.validUntil,
      })
    ) {
      throw new AppException('JOB_INVALID_STATUS_TRANSITION', {
        message: `Talep "${row.jobRequest.status}" durumundayken teklif kabul edilemez.`,
        context: { jobStatus: row.jobRequest.status },
      });
    }

    const breakdown = await this.calculateCommissionFor({
      grossMinor: row.amountMinor,
      currency: row.currency,
      categoryId: row.jobRequest.categoryId,
      cityId: row.jobRequest.cityId,
      isPremiumProvider: row.providerProfile.isPremium,
    });

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.update({
        where: { id },
        data: { status: OfferStatus.ACCEPTED, respondedAt: now },
        include: offerInclude,
      });

      // Rakip teklifler otomatik düşer; satıcı seçildikten sonra bekleyen teklif
      // kalması satıcıları boşuna bekletir.
      await tx.offer.updateMany({
        where: {
          jobRequestId: row.jobRequestId,
          id: { not: id },
          status: OfferStatus.SUBMITTED,
          deletedAt: null,
        },
        data: {
          status: OfferStatus.REJECTED,
          respondedAt: now,
          rejectionReason: 'Müşteri başka bir teklifi kabul etti',
        },
      });

      await tx.jobRequest.update({
        where: { id: row.jobRequestId },
        data: { status: JobRequestStatus.PROVIDER_SELECTED },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobRequestId: row.jobRequestId,
          fromStatus: row.jobRequest.status,
          toStatus: JobRequestStatus.PROVIDER_SELECTED,
          changedByUserId: user.id,
          note: 'Teklif kabul edildi',
        },
      });

      const order = await tx.order.create({
        data: {
          jobRequestId: row.jobRequestId,
          offerId: offer.id,
          customerId: user.id,
          providerProfileId: row.providerProfileId,
          status: OrderStatus.PENDING_PAYMENT,
          totalMinor: breakdown.grossMinor,
          commissionMinor: breakdown.commissionMinor,
          payoutMinor: breakdown.netPayoutMinor,
          currency: breakdown.currency,
          appliedRateBps: breakdown.appliedRateBps,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        },
      });

      // Marketplace → ERP köprüsü hazırlığı; mevcut ödeme/iş akışını değiştirmez.
      const orderCreatedPayload: OrderCreatedEventPayload = {
        orderId: order.id,
        jobRequestId: row.jobRequestId,
        customerId: user.id,
        providerProfileId: row.providerProfileId,
        totalMinor: breakdown.grossMinor,
        currency: breakdown.currency,
      };
      await this.outbox.write(tx, {
        type: DOMAIN_EVENT_TYPES.ORDER_CREATED,
        idempotencyKey: `order.created:${order.id}`,
        tenantId: row.providerProfileId,
        aggregateType: 'Order',
        aggregateId: order.id,
        payload: orderCreatedPayload,
        occurredAt: now.toISOString(),
      });

      return offer;
    });

    const order = await this.prisma.order.findFirst({
      where: { offerId: id, deletedAt: null },
      select: {
        id: true,
        jobRequest: { select: { title: true } },
        customer: { select: { fullName: true } },
        providerProfile: { select: { userId: true } },
      },
    });

    if (order?.jobRequest) {
      await this.notifications.dispatch({
        userId: order.providerProfile.userId,
        type: NotificationType.OFFER_ACCEPTED,
        params: {
          jobTitle: order.jobRequest.title,
          customerName: order.customer.fullName,
        },
        deepLink: deepLinks.order(order.id),
      });
    }

    // Kabul sırasında düşen rakipler de reddedilme bildirimi alır.
    const rivals = await this.prisma.offer.findMany({
      where: {
        jobRequestId: row.jobRequestId,
        id: { not: id },
        status: OfferStatus.REJECTED,
        rejectionReason: 'Müşteri başka bir teklifi kabul etti',
        deletedAt: null,
      },
      select: { providerProfile: { select: { userId: true } } },
    });

    if (rivals.length > 0 && order) {
      await this.notifications.dispatchAll(
        rivals.map((rival) => ({
          userId: rival.providerProfile.userId,
          type: NotificationType.OFFER_REJECTED,
          params: { jobTitle: order.jobRequest?.title ?? 'Talep' },
          deepLink: deepLinks.offers(),
        })),
      );
    }

    return this.present(updated);
  }

  async reject(user: AuthenticatedUser, id: string, reason?: string): Promise<Offer> {
    const row = await this.requireOfferOnOwnJob(user, id);

    if (row.status !== OfferStatus.SUBMITTED) {
      throw new AppException('OFFER_NOT_PENDING', {
        message: 'Yalnızca bekleyen teklifler reddedilebilir.',
        context: { status: row.status },
      });
    }

    const updated = await this.prisma.offer.update({
      where: { id },
      data: {
        status: OfferStatus.REJECTED,
        respondedAt: new Date(),
        rejectionReason: reason ?? null,
      },
      include: offerInclude,
    });

    await this.notifications.dispatch({
      userId: row.providerProfile.userId,
      type: NotificationType.OFFER_REJECTED,
      params: { jobTitle: row.jobRequest.title },
      deepLink: deepLinks.offers(),
    });

    return this.present(updated);
  }

  /** Satıcı kendi teklifini geri çeker. Yanıtlanmış teklif geri çekilemez. */
  async withdraw(user: AuthenticatedUser, id: string): Promise<Offer> {
    const profile = await this.requireProviderProfile(user.id);

    const row = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, providerProfileId: true, status: true },
    });

    if (!row) throw AppException.notFound('Teklif', id);
    if (row.providerProfileId !== profile.id) {
      throw AppException.forbiddenResource('Teklif', { offerId: id });
    }

    if (row.status !== OfferStatus.SUBMITTED) {
      throw new AppException('OFFER_INVALID_STATUS_TRANSITION', {
        message: 'Yalnızca bekleyen teklifler geri çekilebilir.',
        context: { status: row.status },
      });
    }

    const updated = await this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.WITHDRAWN, respondedAt: new Date() },
      include: offerInclude,
    });

    return this.present(updated);
  }

  private async paginate(
    where: Prisma.OfferWhereInput,
    orderBy: Record<string, 'asc' | 'desc'>,
    skip: number,
    take: number,
    page: number,
  ): Promise<PaginatedResult<Offer>> {
    const [rows, total] = await Promise.all([
      this.prisma.offer.findMany({ where, include: offerInclude, orderBy, skip, take }),
      this.prisma.offer.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => this.present(row)),
      total,
      page,
      take,
    );
  }

  private present(row: OfferRow): Offer {
    return toOffer(row, { fileBaseUrl: this.fileBaseUrl });
  }

  private get fileBaseUrl(): string {
    return this.config.fileBaseUrl;
  }

  private isStaff(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
  }

  /**
   * Komisyon kuralları veritabanında yönetilir. Uygun kural bulunamazsa
   * `calculateCommission` yapılandırmadaki varsayılan orana düşer.
   */
  private async calculateCommissionFor(context: {
    grossMinor: number;
    currency: string;
    categoryId: string;
    cityId: string;
    isPremiumProvider: boolean;
  }) {
    const rows = await this.prisma.commissionRule.findMany({
      where: { deletedAt: null, isActive: true },
    });

    const rules: CommissionRule[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      rateBps: row.rateBps,
      fixedMinor: row.fixedMinor,
      premiumRateBps: row.premiumRateBps,
      categoryId: row.categoryId,
      cityId: row.cityId,
      minAmountMinor: row.minAmountMinor,
      maxAmountMinor: row.maxAmountMinor,
      priority: row.priority,
      isActive: row.isActive,
      validFrom: row.validFrom?.toISOString() ?? null,
      validUntil: row.validUntil?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return calculateCommission(context, selectCommissionRule(rules, context));
  }

  private async requireProviderProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        verificationStatus: true,
        services: { select: { categoryId: true } },
        serviceAreas: { select: { districtId: true } },
      },
    });

    if (!profile) {
      throw new AppException('PROVIDER_PROFILE_INCOMPLETE', {
        message: 'Bu işlem için satıcı profiliniz olmalıdır.',
      });
    }

    return { ...profile, isVerified: profile.verificationStatus === 'VERIFIED' };
  }

  private async requireJobVisibleToCustomer(user: AuthenticatedUser, jobId: string): Promise<void> {
    const job = await this.prisma.jobRequest.findFirst({
      where: { id: jobId, deletedAt: null },
      select: { customerId: true },
    });

    if (!job) throw AppException.notFound('İş talebi', jobId);
    if (job.customerId === user.id || this.isStaff(user.role)) return;

    throw AppException.forbiddenResource('İş talebi', { jobId });
  }

  /** Kabul/ret için: teklif var mı ve isteği yapan kişi işin sahibi mi? */
  private async requireOfferOnOwnJob(user: AuthenticatedUser, id: string) {
    const row = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
      include: {
        providerProfile: { select: { isPremium: true, userId: true } },
        jobRequest: {
          select: {
            id: true,
            title: true,
            customerId: true,
            status: true,
            categoryId: true,
            cityId: true,
          },
        },
      },
    });

    if (!row) throw AppException.notFound('Teklif', id);
    if (row.jobRequest.customerId !== user.id) {
      throw AppException.forbiddenResource('Teklif', { offerId: id });
    }

    return row;
  }
}
