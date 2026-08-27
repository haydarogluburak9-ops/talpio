import { Injectable, Optional } from '@nestjs/common';
import {
  calculateCommission,
  compareOffers,
  selectCommissionRule,
} from '@talpio/business-logic';
import { REQUEST_MATCHING, deepLinks } from '@talpio/config';
import {
  DOMAIN_EVENT_TYPES,
  NotificationType,
  OrderSource,
  OrderStatus,
  Permission,
  RequestOfferStatus,
  RequestSource,
  RequestStatus,
  RequestVisibility,
  type CommissionRule,
  type CommerceRequest,
  type OrderCreatedEventPayload,
  type RequestMatchedEventPayload,
  type RequestOffer,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { parseNameTranslations } from '@common/i18n/localized-text';
import { OutboxService } from '@infra/outbox/outbox.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FraudService } from '@modules/fraud/fraud.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { RbacService } from '@modules/rbac/rbac.service';

import {
  MATCH_REASON,
  matchBusinessesToRequest,
  type MatchCandidate,
} from './matching/deterministic-matcher';
import type { MatcherBusiness } from './matching/deterministic-matcher';
import type {
  CreateCommerceRequestDto,
  CreateRequestOfferDto,
  ListRequestsQueryDto,
} from './dto/create-request.dto';
import { toCommerceRequest, toRequestOffer } from './request.mapper';

/**
 * Kategorisiz talebin eşleşme bildiriminde kategori yuvası boş kalmasın. Gövde
 * alıcının dilinde üretildiği için yedek de çok dillidir.
 */
const UNCATEGORIZED_MATCH_LABEL = { tr: 'Talep', en: 'Request' } as const;

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly notifications: NotificationsService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditLogService,
    @Optional() private readonly fraud?: FraudService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateCommerceRequestDto): Promise<CommerceRequest> {
    // Hedef işletme burada doğrulanır: yayında sessizce düşerse alıcı talebinin
    // gittiğini sanır ve kimseden cevap gelmez.
    if (dto.businessId) {
      const target = await this.prisma.business.findFirst({
        where: { id: dto.businessId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!target) throw AppException.notFound('İşletme', dto.businessId);
    }

    const row = await this.prisma.commerceRequest.create({
      data: {
        businessId: dto.businessId ?? null,
        requestType: dto.requestType,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        subcategoryId: dto.subcategoryId ?? null,
        quantity: dto.quantity ?? null,
        unit: dto.unit ?? null,
        specifications: (dto.specifications ?? {}) as Prisma.InputJsonValue,
        budgetMinor: dto.budgetMinor ?? null,
        deliveryCityId: dto.deliveryCityId ?? null,
        deliveryDistrictId: dto.deliveryDistrictId ?? null,
        deliveryAddressText: dto.deliveryAddressText ?? null,
        deliveryDeadline: dto.deliveryDeadline ? new Date(dto.deliveryDeadline) : null,
        // Bir mağazaya teklif isteği açıkça özeldir; aksi belirtilmedikçe
        // eşleştiriciye açılmaz.
        visibility:
          dto.visibility ??
          (dto.businessId ? RequestVisibility.INVITE_ONLY : RequestVisibility.PUBLIC_MATCHED),
        buyerUserId: user.id,
        status: RequestStatus.DRAFT,
        source: dto.source ?? RequestSource.WEB,
      },
    });

    this.fraud?.observeRequests(user.id, row.id);

    if (dto.publish) {
      return this.publish(user, row.id);
    }

    return toCommerceRequest(row);
  }

  async listMine(
    user: AuthenticatedUser,
    query: ListRequestsQueryDto,
  ): Promise<PaginatedResult<CommerceRequest>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { buyerUserId: user.id, deletedAt: null };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.commerceRequest.count({ where }),
      this.prisma.commerceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Teklif sayısı listeyle birlikte gelmezse alıcı her talebi tek tek açmak
    // zorunda kalır; hangisinin cevap aldığını listeden göremez.
    const counts = await this.countOffersByRequest(rows.map((row) => row.id));

    return PaginatedResult.of(
      rows.map((row) =>
        toCommerceRequest({
          ...row,
          offerCount: counts.get(row.id)?.total ?? 0,
          pendingOfferCount: counts.get(row.id)?.pending ?? 0,
        }),
      ),
      total,
      page,
      limit,
    );
  }

  private async countOffersByRequest(
    requestIds: string[],
  ): Promise<Map<string, { total: number; pending: number }>> {
    const counts = new Map<string, { total: number; pending: number }>();
    if (requestIds.length === 0) return counts;

    const groups = await this.prisma.requestOffer.groupBy({
      by: ['requestId', 'status'],
      where: { requestId: { in: requestIds }, deletedAt: null },
      _count: { _all: true },
    });

    for (const group of groups) {
      const current = counts.get(group.requestId) ?? { total: 0, pending: 0 };
      current.total += group._count._all;
      if (group.status === RequestOfferStatus.SUBMITTED) {
        current.pending += group._count._all;
      }
      counts.set(group.requestId, current);
    }

    return counts;
  }

  /**
   * Alıcının tüm taleplerine gelen teklifler.
   *
   * Talep bazlı `listOffers` bir alıcının genel görünümünü kuramaz: kaç talebi
   * varsa o kadar istek atması gerekir. Bu uç profildeki ticaret alanını
   * besler, en yeni teklif başta gelir.
   */
  async listMyOffers(user: AuthenticatedUser, limit = 20): Promise<RequestOffer[]> {
    const rows = await this.prisma.requestOffer.findMany({
      where: {
        deletedAt: null,
        request: { buyerUserId: user.id, deletedAt: null },
      },
      include: {
        business: {
          select: {
            name: true,
            slug: true,
            verificationStatus: true,
            socialProfile: { select: { username: true } },
          },
        },
        request: { select: { id: true, title: true, status: true } },
      },
      orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(limit, 100),
    });

    return rows.map((row) => ({
      ...toRequestOffer(row, row.business),
      request: {
        id: row.request.id,
        title: row.request.title,
        status: row.request.status as RequestStatus,
      },
    }));
  }

  async listMatched(
    user: AuthenticatedUser,
    query: ListRequestsQueryDto,
  ): Promise<PaginatedResult<CommerceRequest>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const businessIds = user.businessIds?.length
      ? user.businessIds
      : (await this.rbac.getEffectivePermissions(user.id)).businessIds;

    if (businessIds.length === 0) {
      return PaginatedResult.of([], 0, page, limit);
    }

    const where = {
      deletedAt: null,
      matches: { some: { businessId: { in: [...businessIds] } } },
      status: { in: [RequestStatus.MATCHING, RequestStatus.QUOTING, RequestStatus.PUBLISHED] },
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.commerceRequest.count({ where }),
      this.prisma.commerceRequest.findMany({
        where,
        include: {
          matches: {
            where: { businessId: { in: [...businessIds] } },
            select: { score: true, reasons: true },
            orderBy: { score: 'desc' },
            take: 1,
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => {
        const match = row.matches[0];
        const reasons = match?.reasons as { labels?: unknown } | null;
        const labels = Array.isArray(reasons?.labels)
          ? reasons.labels.filter((item): item is string => typeof item === 'string')
          : [];
        return toCommerceRequest({
          ...row,
          matchScore: match?.score ?? null,
          matchReasons: labels.length > 0 ? labels : null,
        });
      }),
      total,
      page,
      limit,
    );
  }

  /**
   * Talebin kimlere gideceğini belirler.
   *
   * `INVITE_ONLY` + hedef işletme varsa eşleştirici hiç çalışmaz: alıcı satıcıyı
   * kendisi seçmiştir, kategori ya da servis alanı tutmuyor diye elenmesi
   * alıcının isteğini boşa çıkarır. Diğer tüm taleplerde deterministik
   * eşleştirici aday havuzunu puanlar.
   */
  private async resolveRecipients(row: {
    id: string;
    buyerUserId: string;
    businessId: string | null;
    visibility: string;
    categoryId: string | null;
    subcategoryId: string | null;
    deliveryCityId: string | null;
    deliveryDistrictId: string | null;
    deliveryCity: { name: string } | null;
    quantity: Prisma.Decimal | null;
    specifications: unknown;
  }): Promise<{
    matches: MatchCandidate[];
    membershipsByBusiness: Map<string, string[]>;
  }> {
    if (row.visibility === RequestVisibility.INVITE_ONLY && row.businessId) {
      const target = await this.prisma.business.findFirst({
        where: { id: row.businessId, deletedAt: null, isActive: true },
        select: {
          id: true,
          memberships: { where: { status: 'ACTIVE' }, select: { userId: true } },
        },
      });
      if (!target) return { matches: [], membershipsByBusiness: new Map() };

      return {
        matches: [
          {
            businessId: target.id,
            score: 100,
            reasons: {
              codes: [MATCH_REASON.DIRECT_INVITE],
              labels: ['Buyer requested a quote from you directly'],
              details: { cityName: row.deliveryCity?.name ?? null },
            },
          },
        ],
        membershipsByBusiness: new Map([
          [target.id, target.memberships.map((member) => member.userId)],
        ]),
      };
    }

    const { matcherInput, membershipsByBusiness } = await this.loadMatcherBusinesses(
      row.buyerUserId,
    );

    const spec =
      row.specifications &&
      typeof row.specifications === 'object' &&
      !Array.isArray(row.specifications)
        ? Object.keys(row.specifications)
        : [];

    const ranked = matchBusinessesToRequest(
      {
        categoryId: row.categoryId,
        subcategoryId: row.subcategoryId,
        deliveryCityId: row.deliveryCityId,
        deliveryDistrictId: row.deliveryDistrictId,
        cityName: row.deliveryCity?.name ?? null,
        quantity: row.quantity,
        specificationKeys: spec,
        buyerUserId: row.buyerUserId,
      },
      matcherInput,
    );

    // Kategorisiz talepte eşleştirici kategori filtresini uygulayamaz; aday
    // havuzu tüm aktif işletmeler olur. Liste puana göre sıralı geldiği için
    // baştan kesmek en isabetli işletmeleri korur.
    const matches = ranked.slice(
      0,
      row.categoryId ? REQUEST_MATCHING.maxMatches : REQUEST_MATCHING.maxMatchesWithoutCategory,
    );

    return { matches, membershipsByBusiness };
  }

  /**
   * Kullanıcının şehrindeki açık talepler.
   *
   * Eşleşme listesinden farkı: eşleşme yalnızca kategori/servis alanı tutan
   * işletmelere gider, burada ise şehirdeki tüm açık talepler görünür. Amaç
   * yeni gelen kullanıcının siteye girdiğinde canlı bir talep akışı görmesi;
   * bu yüzden alıcının kendi talepleri ve davetli talepler dışarıda kalır.
   */
  async listNearby(user: AuthenticatedUser, limit = 5): Promise<CommerceRequest[]> {
    const cityId = await this.resolveViewerCityId(user);
    if (!cityId) return [];

    const rows = await this.prisma.commerceRequest.findMany({
      where: {
        deletedAt: null,
        deliveryCityId: cityId,
        buyerUserId: { not: user.id },
        visibility: RequestVisibility.PUBLIC_MATCHED,
        status: { in: [RequestStatus.PUBLISHED, RequestStatus.MATCHING, RequestStatus.QUOTING] },
      },
      orderBy: { publishedAt: 'desc' },
      take: Math.min(limit, 20),
    });

    return rows.map((row) => toCommerceRequest(row));
  }

  /**
   * Görüntüleyenin şehri. Sırayla varsayılan adres, sosyal profil konumu ve
   * işletmesinin ilk servis alanı denenir; hiçbiri yoksa yakınlık hesaplanamaz.
   */
  private async resolveViewerCityId(user: AuthenticatedUser): Promise<string | null> {
    const address = await this.prisma.address.findFirst({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: { cityId: true },
    });
    if (address?.cityId) return address.cityId;

    const profile = await this.prisma.socialProfile.findFirst({
      where: { userId: user.id, deletedAt: null, locationCityId: { not: null } },
      select: { locationCityId: true },
    });
    if (profile?.locationCityId) return profile.locationCityId;

    const businessIds = user.businessIds ?? [];
    if (businessIds.length === 0) return null;

    const serviceArea = await this.prisma.businessServiceArea.findFirst({
      where: { businessId: { in: [...businessIds] } },
      select: { cityId: true },
    });

    return serviceArea?.cityId ?? null;
  }

  async getById(user: AuthenticatedUser, id: string): Promise<CommerceRequest> {
    const row = await this.prisma.commerceRequest.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { matches: true } } },
    });
    if (!row) throw AppException.notFound('Talep', id);

    const canModerate = user.permissionCodes?.includes(Permission.ADMIN_REQUEST_MODERATE);
    if (row.buyerUserId === user.id || canModerate) {
      /** Dağıtım kapsamı yalnızca alıcıya/moderatöre gösterilir. */
      return toCommerceRequest({ ...row, matchCount: row._count?.matches ?? null });
    }

    const businessIds = user.businessIds ?? [];
    if (businessIds.length > 0) {
      const match = await this.prisma.requestMatch.findFirst({
        where: { requestId: id, businessId: { in: [...businessIds] } },
        select: { id: true },
      });
      if (match) return toCommerceRequest(row);
    }

    throw AppException.forbiddenResource('Talep', { requestId: id });
  }

  async publish(user: AuthenticatedUser, id: string): Promise<CommerceRequest> {
    const row = await this.prisma.commerceRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { slug: true, name: true, nameTranslations: true } },
        deliveryCity: { select: { name: true } },
      },
    });
    if (!row) throw AppException.notFound('Talep', id);
    if (row.buyerUserId !== user.id) {
      throw AppException.forbiddenResource('Talep', { requestId: id });
    }
    if (row.status !== RequestStatus.DRAFT && row.status !== RequestStatus.PUBLISHED) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Bu talep yayınlanamaz.',
        context: { status: row.status },
      });
    }

    const classification = {
      categorySlug: row.category?.slug ?? null,
      fromSpecifications: row.specifications,
      method: 'deterministic',
    };

    const { matches, membershipsByBusiness } = await this.resolveRecipients(row);

    const now = new Date();
    const shortDescription = row.description.replace(/\s+/g, ' ').trim().slice(0, 140);
    const cityName = row.deliveryCity?.name ?? '—';
    const categoryName = row.category
      ? (parseNameTranslations(row.category.nameTranslations) ?? row.category.name)
      : UNCATEGORIZED_MATCH_LABEL;
    const deadline = row.deliveryDeadline?.toISOString() ?? '';

    const updated = await this.prisma.$transaction(async (tx) => {
      const keepIds = matches.map((m) => m.businessId);
      if (keepIds.length === 0) {
        await tx.requestMatch.deleteMany({ where: { requestId: id } });
      } else {
        await tx.requestMatch.deleteMany({
          where: { requestId: id, businessId: { notIn: keepIds } },
        });
      }

      for (const match of matches) {
        await tx.requestMatch.upsert({
          where: { requestId_businessId: { requestId: id, businessId: match.businessId } },
          create: {
            requestId: id,
            businessId: match.businessId,
            score: match.score,
            reasons: match.reasons as unknown as Prisma.InputJsonValue,
          },
          update: {
            score: match.score,
            reasons: match.reasons as unknown as Prisma.InputJsonValue,
          },
        });
      }

      const notifiedUsers = new Map<string, { businessId: string; score: number }>();
      for (const match of matches) {
        const members = membershipsByBusiness.get(match.businessId) ?? [];
        for (const userId of members) {
          const existing = notifiedUsers.get(userId);
          if (!existing || match.score > existing.score) {
            notifiedUsers.set(userId, { businessId: match.businessId, score: match.score });
          }
        }
      }

      for (const [userId, info] of notifiedUsers) {
        const payload: RequestMatchedEventPayload = {
          requestId: id,
          businessId: info.businessId,
          userId,
          requestTitle: row.title,
          categoryName,
          cityName,
          shortDescription,
          deadline,
          matchScore: info.score,
        };
        await this.outbox.write(tx, {
          type: DOMAIN_EVENT_TYPES.REQUEST_MATCHED,
          idempotencyKey: `request.matched:${id}:${userId}`,
          tenantId: info.businessId,
          aggregateType: 'CommerceRequest',
          aggregateId: id,
          payload,
          occurredAt: now.toISOString(),
        });
      }

      return tx.commerceRequest.update({
        where: { id },
        data: {
          status: RequestStatus.MATCHING,
          publishedAt: row.publishedAt ?? now,
          aiClassification: classification,
          aiConfidence: 1,
        },
      });
    });

    await this.audit.record({
      actorId: user.id,
      action: 'commerce_request.publish',
      entityType: 'CommerceRequest',
      entityId: id,
      changes: { matchCount: matches.length, classification },
    });

    return toCommerceRequest({ ...updated, matchCount: matches.length });
  }

  private async loadMatcherBusinesses(buyerUserId: string): Promise<{
    matcherInput: MatcherBusiness[];
    membershipsByBusiness: Map<string, string[]>;
  }> {
    const businesses = await this.prisma.business.findMany({
      // Demo işletmeler akışta vitrin olarak durur ama teklif veremez; eşleşme
      // havuzuna girerlerse gerçek alıcı cevapsız kalacak bir satıcıyla eşleşir.
      where: { deletedAt: null, isActive: true, isDemo: false },
      include: {
        categories: { select: { categoryId: true } },
        serviceAreas: { select: { cityId: true, districtId: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            userId: true,
            user: { select: { lastActiveAt: true } },
          },
        },
        providerProfile: {
          select: {
            availability: {
              where: { isActive: true },
              select: { dayOfWeek: true, startTime: true, endTime: true },
            },
          },
        },
      },
    });

    const ids = businesses.map((b) => b.id);
    const memberIds = [...new Set(businesses.flatMap((b) => b.memberships.map((m) => m.userId)))];

    const [blocks, offerGroups, matchGroups] = await Promise.all([
      memberIds.length === 0
        ? Promise.resolve([])
        : this.prisma.userBlock.findMany({
            where: {
              OR: [
                { blockerUserId: buyerUserId, blockedUserId: { in: memberIds } },
                { blockedUserId: buyerUserId, blockerUserId: { in: memberIds } },
              ],
            },
            select: { blockerUserId: true, blockedUserId: true },
          }),
      ids.length === 0
        ? Promise.resolve([])
        : this.prisma.requestOffer.groupBy({
            by: ['businessId'],
            where: { businessId: { in: ids }, deletedAt: null },
            _count: { _all: true },
          }),
      ids.length === 0
        ? Promise.resolve([])
        : this.prisma.requestMatch.groupBy({
            by: ['businessId'],
            where: { businessId: { in: ids } },
            _count: { _all: true },
          }),
    ]);

    const blockedPairs = new Set(
      blocks.flatMap((b) => [
        `${b.blockerUserId}:${b.blockedUserId}`,
        `${b.blockedUserId}:${b.blockerUserId}`,
      ]),
    );
    const offerCount = new Map(offerGroups.map((row) => [row.businessId, row._count._all]));
    const matchCount = new Map(matchGroups.map((row) => [row.businessId, row._count._all]));

    const membershipsByBusiness = new Map<string, string[]>();
    const matcherInput: MatcherBusiness[] = businesses.map((b) => {
      const areas = new Map<string, (string | null)[]>();
      for (const area of b.serviceAreas) {
        const list = areas.get(area.cityId) ?? [];
        list.push(area.districtId);
        areas.set(area.cityId, list);
      }

      const memberUserIds = b.memberships.map((m) => m.userId);
      membershipsByBusiness.set(b.id, memberUserIds);

      const blockedWithBuyer = memberUserIds.some(
        (userId) =>
          blockedPairs.has(`${buyerUserId}:${userId}`) ||
          blockedPairs.has(`${userId}:${buyerUserId}`),
      );

      const lastActiveAt = b.memberships.reduce<Date | null>((latest, membership) => {
        const at = membership.user.lastActiveAt;
        if (!at) return latest;
        if (!latest || at > latest) return at;
        return latest;
      }, null);

      const matchesForBiz = matchCount.get(b.id) ?? 0;
      const offersForBiz = offerCount.get(b.id) ?? 0;
      const responseRate = matchesForBiz > 0 ? Math.min(1, offersForBiz / matchesForBiz) : null;

      return {
        id: b.id,
        isActive: b.isActive,
        verificationStatus: b.verificationStatus,
        minOrderQuantity: b.minOrderQuantity,
        maxOrderQuantity: b.maxOrderQuantity,
        categoryIds: b.categories.map((c) => c.categoryId),
        serviceAreas: areas,
        memberUserIds,
        lastActiveAt,
        responseRate,
        availability: b.providerProfile?.availability ?? null,
        blockedWithBuyer,
      };
    });

    return { matcherInput, membershipsByBusiness };
  }

  async createOffer(
    user: AuthenticatedUser,
    requestId: string,
    dto: CreateRequestOfferDto,
  ): Promise<RequestOffer> {
    await this.rbac.assertBusinessAccess(user.id, dto.businessId);

    const request = await this.prisma.commerceRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      select: {
        id: true,
        title: true,
        buyerUserId: true,
        status: true,
        matches: { where: { businessId: dto.businessId }, select: { id: true } },
      },
    });
    if (!request) throw AppException.notFound('Talep', requestId);

    if (
      request.status !== RequestStatus.MATCHING &&
      request.status !== RequestStatus.QUOTING &&
      request.status !== RequestStatus.PUBLISHED
    ) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Bu talep teklife kapalı.',
        context: { status: request.status },
      });
    }

    if (request.matches.length === 0) {
      throw new AppException('FORBIDDEN', {
        message: 'Yalnızca eşleştiğiniz taleplere teklif verebilirsiniz.',
      });
    }

    const existing = await this.prisma.requestOffer.findFirst({
      where: { requestId, businessId: dto.businessId, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new AppException('DUPLICATE_OFFER', {
        message: 'Bu talebe zaten teklif verdiniz.',
      });
    }

    const business = await this.prisma.business.findFirst({
      where: { id: dto.businessId, deletedAt: null },
      select: { name: true },
    });

    const offer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.requestOffer.create({
        data: {
          requestId,
          businessId: dto.businessId,
          createdByUserId: user.id,
          status: RequestOfferStatus.SUBMITTED,
          amountMinor: dto.amountMinor,
          currency: dto.currency ?? 'TRY',
          deliveryDays: dto.deliveryDays ?? null,
          shippingIncluded: dto.shippingIncluded,
          locationText: dto.locationText.trim(),
          note: dto.note ?? null,
          validUntil: new Date(dto.validUntil),
          submittedAt: new Date(),
        },
      });

      if (request.status === RequestStatus.MATCHING || request.status === RequestStatus.PUBLISHED) {
        await tx.commerceRequest.update({
          where: { id: requestId },
          data: { status: RequestStatus.QUOTING },
        });
      }

      return created;
    });

    await this.notifications.dispatch({
      userId: request.buyerUserId,
      type: NotificationType.REQUEST_OFFER_RECEIVED,
      params: {
        requestTitle: request.title,
        businessName: business?.name ?? 'Tedarikçi',
        amountMinor: dto.amountMinor,
        currency: dto.currency ?? 'TRY',
      },
      deepLink: deepLinks.jobOffers(requestId),
    });
    this.fraud?.observeOffers(user.id, offer.id);

    return toRequestOffer(offer);
  }

  async listOffers(user: AuthenticatedUser, requestId: string): Promise<RequestOffer[]> {
    const request = await this.prisma.commerceRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      select: { buyerUserId: true },
    });
    if (!request) throw AppException.notFound('Talep', requestId);
    if (request.buyerUserId !== user.id) {
      throw AppException.forbiddenResource('Talep', { requestId });
    }

    const rows = await this.prisma.requestOffer.findMany({
      where: { requestId, deletedAt: null },
      include: {
        business: {
          select: {
            name: true,
            slug: true,
            verificationStatus: true,
            socialProfile: { select: { username: true } },
            providerProfile: {
              select: {
                averageRating: true,
                averageResponseMinutes: true,
              },
            },
          },
        },
      },
      orderBy: { amountMinor: 'asc' },
    });

    const comparison = compareOffers(
      rows.map((row) => ({
        id: row.id,
        amountMinor: row.amountMinor,
        deliveryDays: row.deliveryDays,
        averageRating: row.business.providerProfile?.averageRating
          ? Number(row.business.providerProfile.averageRating.toString())
          : null,
        verified: row.business.verificationStatus === 'VERIFIED',
        noteLength: row.note?.trim().length ?? 0,
        responseMinutes: row.business.providerProfile?.averageResponseMinutes ?? null,
      })),
    );

    return rows.map((row) => ({
      ...toRequestOffer(row, row.business),
      badges: comparison.badgesByOfferId[row.id] ?? [],
    }));
  }

  async acceptOffer(
    user: AuthenticatedUser,
    offerId: string,
  ): Promise<{
    offer: RequestOffer;
    orderId: string;
  }> {
    const offer = await this.prisma.requestOffer.findFirst({
      where: { id: offerId, deletedAt: null },
      include: {
        request: true,
        business: {
          select: {
            id: true,
            name: true,
            providerProfileId: true,
            providerProfile: { select: { id: true, isPremium: true, userId: true } },
          },
        },
      },
    });

    if (!offer) throw AppException.notFound('Teklif', offerId);
    if (offer.request.buyerUserId !== user.id) {
      throw AppException.forbiddenResource('Teklif', { offerId });
    }
    if (offer.status !== RequestOfferStatus.SUBMITTED) {
      throw new AppException('OFFER_NOT_PENDING', {
        message: 'Yalnızca bekleyen teklifler kabul edilebilir.',
      });
    }
    if (offer.validUntil.getTime() <= Date.now()) {
      throw new AppException('OFFER_EXPIRED', { message: 'Bu teklifin geçerlilik süresi dolmuş.' });
    }

    const providerProfileId = offer.business.providerProfileId;
    if (!providerProfileId || !offer.business.providerProfile) {
      throw new AppException('PROVIDER_PROFILE_INCOMPLETE', {
        message: 'Tedarikçinin sipariş için sağlayıcı profili bağlı değil.',
      });
    }

    const breakdown = await this.calculateCommissionFor({
      grossMinor: offer.amountMinor,
      currency: offer.currency,
      categoryId: offer.request.categoryId,
      cityId: offer.request.deliveryCityId,
      isPremiumProvider: offer.business.providerProfile.isPremium,
    });

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const accepted = await tx.requestOffer.update({
        where: { id: offerId },
        data: { status: RequestOfferStatus.ACCEPTED },
      });

      await tx.requestOffer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: offerId },
          status: RequestOfferStatus.SUBMITTED,
          deletedAt: null,
        },
        data: { status: RequestOfferStatus.REJECTED },
      });

      await tx.commerceRequest.update({
        where: { id: offer.requestId },
        data: { status: RequestStatus.SELECTED },
      });

      const order = await tx.order.create({
        data: {
          jobRequestId: null,
          offerId: null,
          customerId: user.id,
          providerProfileId,
          status: OrderStatus.PENDING_PAYMENT,
          source: OrderSource.COMMERCE_REQUEST,
          totalMinor: breakdown.grossMinor,
          commissionMinor: breakdown.commissionMinor,
          payoutMinor: breakdown.netPayoutMinor,
          currency: breakdown.currency,
          appliedRateBps: breakdown.appliedRateBps,
        },
      });

      await tx.requestOrderLink.create({
        data: { requestOfferId: offerId, orderId: order.id },
      });

      const payload: OrderCreatedEventPayload = {
        orderId: order.id,
        jobRequestId: null,
        customerId: user.id,
        providerProfileId,
        totalMinor: breakdown.grossMinor,
        currency: breakdown.currency,
      };

      await this.outbox.write(tx, {
        type: DOMAIN_EVENT_TYPES.ORDER_CREATED,
        idempotencyKey: `order.created:${order.id}`,
        tenantId: providerProfileId,
        aggregateType: 'Order',
        aggregateId: order.id,
        payload,
        occurredAt: now.toISOString(),
      });

      return { accepted, orderId: order.id };
    });

    const buyer = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true },
    });
    await this.notifications.dispatch({
      userId: offer.business.providerProfile.userId,
      type: NotificationType.REQUEST_OFFER_ACCEPTED,
      params: {
        requestTitle: offer.request.title,
        buyerName: buyer?.fullName ?? 'Alıcı',
      },
      deepLink: deepLinks.order(result.orderId),
    });

    await this.audit.record({
      actorId: user.id,
      action: 'request_offer.accept',
      entityType: 'RequestOffer',
      entityId: offerId,
      changes: { orderId: result.orderId, requestId: offer.requestId },
    });

    return { offer: toRequestOffer(result.accepted), orderId: result.orderId };
  }

  private async calculateCommissionFor(context: {
    grossMinor: number;
    currency: string;
    categoryId: string | null;
    cityId: string | null;
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
      deletedAt: row.deletedAt?.toISOString() ?? null,
    }));

    return calculateCommission(context, selectCommissionRule(rules, context));
  }
}
