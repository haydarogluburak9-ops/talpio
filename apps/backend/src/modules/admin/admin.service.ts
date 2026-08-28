import { Injectable, Optional } from '@nestjs/common';
import { ROLE_PERMISSIONS } from '@talpio/business-logic';
import { deepLinks } from '@talpio/config';
import {
  JobRequestStatus,
  NotificationType,
  OfferStatus,
  OrderStatus,
  Permission,
  ReviewStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
  ContentReportStatus,
  ContentReportTarget,
  FraudFlagStatus,
  ModerationAction,
  type AdminCommissionRuleSummary,
  type ContentReport,
  type AdminDashboard,
  type AdminJobSummary,
  type AdminNotificationSummary,
  type AdminOfferSummary,
  type AdminOrderSummary,
  type AdminPaymentSummary,
  type AdminProviderSummary,
  type AdminReviewSummary,
  type AdminRoleMatrix,
  type AdminSystemSetting,
  type AdminTransactionSummary,
  type AdminUserSummary,
  type ServiceCategory,
} from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { parseNameTranslations } from '@common/i18n/localized-text';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { QueueService } from '@infra/queue/queue.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type { Prisma } from '@/generated/prisma/client';

import {
  SECRET_SETTING_MASK,
  adminCommissionInclude,
  adminJobInclude,
  adminNotificationInclude,
  adminOfferInclude,
  adminOrderInclude,
  adminPaymentInclude,
  adminProviderInclude,
  adminReviewInclude,
  adminTransactionInclude,
  adminUserInclude,
  toAdminCommissionRule,
  toAdminJob,
  toAdminNotification,
  toAdminOffer,
  toAdminOrder,
  toAdminPayment,
  toAdminProvider,
  toAdminReview,
  toAdminSystemSetting,
  toAdminTransaction,
  toAdminUser,
} from './admin.mapper';
import { AuditLogService, type AuditEntryInput } from './audit-log.service';
import type {
  ListAdminCommissionsQueryDto,
  ListAdminJobsQueryDto,
  ListAdminNotificationsQueryDto,
  ListAdminOffersQueryDto,
  ListAdminOrdersQueryDto,
  ListAdminPaymentsQueryDto,
  ListAdminProvidersQueryDto,
  ListAdminReviewsQueryDto,
  ListAdminTransactionsQueryDto,
  ListAdminUsersQueryDto,
  UpdateReviewModerationDto,
  UpdateSystemSettingDto,
  UpdateUserStatusDto,
  UpdateVerificationDto,
  UpdateContentReportDto,
  ListContentReportsQueryDto,
  BulkContentReportDto,
  UpdateFraudFlagDto,
  VerifyBackupDto,
} from './dto/admin-query.dto';
import { resolveAssetUrl } from '@modules/social/social.mapper';

/** Panelde "açık" sayılan talep durumları: henüz bir satıcı üstlenmemiş işler. */
const OPEN_JOB_STATUSES = [JobRequestStatus.PUBLISHED, JobRequestStatus.OFFERS_RECEIVED] as const;

/** Panelde "devam eden" sayılan sipariş durumları. */
const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_APPROVAL,
] as const;

/** İstek üst verisi; denetim kaydına yazılır. */
export interface RequestContext {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationsService,
    @Optional() private readonly queues?: QueueService,
  ) {}

  listDeadLetters() {
    return this.queues?.listDeadLetters(50) ?? [];
  }

  /**
   * Panelin özet kartları.
   *
   * Tüm sayımlar tek turda paralel çalıştırılır; sıralı beklenirse panel
   * açılışı sayım sayısı kadar gecikirdi.
   */
  async dashboard(): Promise<AdminDashboard> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Vitrin hesapları gerçek kayıt sayısını şişirir; ayrı kalemde raporlanır.
    // Personel hesapları da gerçek kayıt değildir, ancak `isDemo` taşımazlar:
    // o bayrak yalnızca vitrin içeriğini işaretler, bu yüzden rol üzerinden
    // ayrıca dışarıda bırakılırlar.
    const activeUser = {
      deletedAt: null,
      isDemo: false,
      role: { notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT] },
    };

    const [
      totalUsers,
      customers,
      providers,
      newThisWeek,
      demoUsers,
      verifiedProviders,
      pendingProviders,
      totalJobs,
      openJobs,
      completedJobs,
      cancelledJobs,
      totalOffers,
      pendingOffers,
      acceptedOffers,
      totalOrders,
      activeOrders,
      completedOrderStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: activeUser }),
      this.prisma.user.count({ where: { ...activeUser, role: UserRole.CUSTOMER } }),
      this.prisma.user.count({ where: { ...activeUser, role: UserRole.PROVIDER } }),
      this.prisma.user.count({ where: { ...activeUser, createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { deletedAt: null, isDemo: true } }),
      this.prisma.providerProfile.count({
        where: { deletedAt: null, verificationStatus: VerificationStatus.VERIFIED },
      }),
      this.prisma.providerProfile.count({
        where: { deletedAt: null, verificationStatus: VerificationStatus.PENDING },
      }),
      this.prisma.jobRequest.count({ where: { deletedAt: null } }),
      this.prisma.jobRequest.count({
        where: { deletedAt: null, status: { in: [...OPEN_JOB_STATUSES] } },
      }),
      this.prisma.jobRequest.count({
        where: { deletedAt: null, status: JobRequestStatus.COMPLETED },
      }),
      this.prisma.jobRequest.count({
        where: { deletedAt: null, status: JobRequestStatus.CANCELLED },
      }),
      this.prisma.offer.count({ where: { deletedAt: null } }),
      this.prisma.offer.count({ where: { deletedAt: null, status: OfferStatus.SUBMITTED } }),
      this.prisma.offer.count({ where: { deletedAt: null, status: OfferStatus.ACCEPTED } }),
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.count({
        where: { deletedAt: null, status: { in: [...ACTIVE_ORDER_STATUSES] } },
      }),
      this.prisma.order.aggregate({
        where: { deletedAt: null, status: OrderStatus.COMPLETED },
        _count: { _all: true },
        _sum: { totalMinor: true, commissionMinor: true },
      }),
    ]);

    const currency = this.config.defaultCurrency;

    return {
      users: { total: totalUsers, customers, providers, newThisWeek, demo: demoUsers },
      providers: { verified: verifiedProviders, pendingVerification: pendingProviders },
      jobs: {
        total: totalJobs,
        open: openJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
      },
      offers: { total: totalOffers, pending: pendingOffers, accepted: acceptedOffers },
      orders: {
        total: totalOrders,
        active: activeOrders,
        completed: completedOrderStats._count._all,
        completedVolume: {
          amountMinor: completedOrderStats._sum.totalMinor ?? 0,
          currency,
        },
        commissionEarned: {
          amountMinor: completedOrderStats._sum.commissionMinor ?? 0,
          currency,
        },
      },
    };
  }

  async listUsers(query: ListAdminUsersQueryDto): Promise<PaginatedResult<AdminUserSummary>> {
    const where = {
      deletedAt: null,
      ...(query.role ? { role: { in: query.role } } : {}),
      ...(query.status ? { status: { in: query.status } } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
              { phone: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: adminUserInclude,
        orderBy: query.toOrderBy(['createdAt', 'fullName', 'lastActiveAt']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => toAdminUser(row, this.config.fileBaseUrl)),
      total,
      query.page,
      query.limit,
    );
  }

  async getUser(id: string): Promise<AdminUserSummary> {
    const row = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: adminUserInclude,
    });

    if (!row) throw AppException.notFound('Kullanıcı', id);

    return toAdminUser(row, this.config.fileBaseUrl);
  }

  /**
   * Hesap durumunu değiştirir.
   *
   * Askıya alma ve engelleme tüm oturumları da kapatır: yalnızca durumu
   * değiştirmek, elinde geçerli erişim jetonu olan kullanıcının jeton ömrü
   * boyunca çalışmaya devam etmesine izin verirdi.
   */
  async updateUserStatus(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserStatusDto,
    context: RequestContext,
  ): Promise<AdminUserSummary> {
    const current = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, role: true },
    });

    if (!current) throw AppException.notFound('Kullanıcı', id);

    if (current.id === actor.id) {
      throw new AppException('FORBIDDEN', {
        message: 'Kendi hesabınızın durumunu değiştiremezsiniz.',
      });
    }

    // Personel hesaplarına yalnızca süper admin dokunabilir; aksi halde bir
    // admin diğerini kilitleyip paneli sahipsiz bırakabilirdi.
    if (isStaffRole(current.role) && actor.role !== UserRole.SUPER_ADMIN) {
      throw new AppException('FORBIDDEN', {
        message: 'Personel hesaplarını yalnızca süper admin yönetebilir.',
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      include: adminUserInclude,
    });

    if (dto.status !== UserStatus.ACTIVE) {
      // Oturumların yanında bekleyen doğrulama jetonları da tüketilir: yasaktan
      // önce alınmış bir e-posta jetonu, hesabı yeniden aktifleştirmek için
      // kullanılabilirdi.
      await this.prisma.$transaction([
        this.prisma.userSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        this.prisma.verificationToken.updateMany({
          where: { userId: id, consumedAt: null },
          data: { consumedAt: new Date() },
        }),
      ]);
    }

    await this.audit.record(
      this.entry(actor, context, {
        action: 'user.status.updated',
        entityType: 'User',
        entityId: id,
        changes: { from: current.status, to: dto.status, reason: dto.reason ?? null },
      }),
    );

    return toAdminUser(updated, this.config.fileBaseUrl);
  }

  /** Kullanıcının tüm cihazlardaki oturumlarını kapatır. */
  async revokeUserSessions(
    actor: AuthenticatedUser,
    id: string,
    context: RequestContext,
  ): Promise<{ revokedCount: number }> {
    const exists = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!exists) throw AppException.notFound('Kullanıcı', id);

    const { count } = await this.prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record(
      this.entry(actor, context, {
        action: 'user.sessions.revoked',
        entityType: 'User',
        entityId: id,
        changes: { revokedCount: count },
      }),
    );

    return { revokedCount: count };
  }

  async listProviders(
    query: ListAdminProvidersQueryDto,
  ): Promise<PaginatedResult<AdminProviderSummary>> {
    const where = {
      deletedAt: null,
      ...(query.verificationStatus ? { verificationStatus: { in: query.verificationStatus } } : {}),
      ...(query.q
        ? {
            OR: [
              { businessName: { contains: query.q, mode: 'insensitive' as const } },
              { user: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
              { user: { email: { contains: query.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        include: adminProviderInclude,
        orderBy: query.toOrderBy(['createdAt', 'completedJobCount', 'averageRating']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.providerProfile.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => toAdminProvider(row, this.config.fileBaseUrl)),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Satıcı doğrulama kararını uygular.
   *
   * Karar belgelere de yansıtılır: onaylanan profilin bekleyen belgeleri
   * onaylanmış, reddedilenin belgeleri reddedilmiş sayılır. Aksi halde belge
   * listesi profil rozetiyle çelişirdi.
   */
  async updateProviderVerification(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateVerificationDto,
    context: RequestContext,
  ): Promise<AdminProviderSummary> {
    const current = await this.prisma.providerProfile.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        userId: true,
        verificationStatus: true,
        documents: { where: { status: 'PENDING' }, select: { id: true } },
      },
    });

    if (!current) throw AppException.notFound('Satıcı profili', id);

    const approved = dto.verificationStatus === VerificationStatus.VERIFIED;
    const reviewedAt = new Date();
    const pendingDocumentCount = current.documents.length;
    const rejectionReason = dto.reason ?? 'Belge kabul edilmedi.';

    const [updated] = await this.prisma.$transaction([
      this.prisma.providerProfile.update({
        where: { id },
        data: { verificationStatus: dto.verificationStatus },
        include: adminProviderInclude,
      }),
      this.prisma.providerDocument.updateMany({
        where: { providerProfileId: id, status: 'PENDING' },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          reviewedAt,
          reviewedByUserId: actor.id,
          ...(approved ? {} : { rejectionReason }),
        },
      }),
    ]);

    await this.audit.record(
      this.entry(actor, context, {
        action: 'provider.verification.updated',
        entityType: 'ProviderProfile',
        entityId: id,
        changes: {
          from: current.verificationStatus,
          to: dto.verificationStatus,
          reason: dto.reason ?? null,
        },
      }),
    );

    if (approved) {
      await this.notifications.dispatch({
        userId: current.userId,
        type: NotificationType.DOCUMENT_APPROVED,
        params: { documentCount: Math.max(pendingDocumentCount, 1) },
        deepLink: deepLinks.providerProfile(),
      });
    } else {
      await this.notifications.dispatch({
        userId: current.userId,
        type: NotificationType.DOCUMENT_REJECTED,
        params: { reason: rejectionReason },
        deepLink: deepLinks.providerProfile(),
      });
    }

    return toAdminProvider(updated, this.config.fileBaseUrl);
  }

  async listNotifications(
    query: ListAdminNotificationsQueryDto,
  ): Promise<PaginatedResult<AdminNotificationSummary>> {
    const where = {
      ...(query.type?.length ? { type: { in: query.type } } : {}),
      ...(query.channel?.length ? { channels: { hasSome: query.channel } } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.unread ? { readAt: null } : {}),
      ...(query.q
        ? {
            OR: [
              { user: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
              { user: { email: { contains: query.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: adminNotificationInclude,
        orderBy: query.toOrderBy(['createdAt']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminNotification), total, query.page, query.limit);
  }

  async listJobs(query: ListAdminJobsQueryDto): Promise<PaginatedResult<AdminJobSummary>> {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: { in: query.status } } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.q ? { title: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.jobRequest.findMany({
        where,
        include: adminJobInclude,
        orderBy: query.toOrderBy(['createdAt', 'publishedAt', 'offerCount']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.jobRequest.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminJob), total, query.page, query.limit);
  }

  async listOffers(query: ListAdminOffersQueryDto): Promise<PaginatedResult<AdminOfferSummary>> {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: { in: query.status } } : {}),
      ...(query.jobRequestId ? { jobRequestId: query.jobRequestId } : {}),
      ...(query.q
        ? { jobRequest: { title: { contains: query.q, mode: 'insensitive' as const } } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: adminOfferInclude,
        orderBy: query.toOrderBy(['createdAt', 'amountMinor', 'validUntil']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.offer.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminOffer), total, query.page, query.limit);
  }

  async listOrders(query: ListAdminOrdersQueryDto): Promise<PaginatedResult<AdminOrderSummary>> {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: { in: query.status } } : {}),
      ...(query.q
        ? { jobRequest: { title: { contains: query.q, mode: 'insensitive' as const } } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: adminOrderInclude,
        orderBy: query.toOrderBy(['createdAt', 'totalMinor']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminOrder), total, query.page, query.limit);
  }

  async listPayments(
    query: ListAdminPaymentsQueryDto,
  ): Promise<PaginatedResult<AdminPaymentSummary>> {
    const where = {
      ...(query.status ? { status: { in: query.status } } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(query.q
        ? {
            OR: [
              { providerReference: { contains: query.q, mode: 'insensitive' as const } },
              {
                order: {
                  jobRequest: { title: { contains: query.q, mode: 'insensitive' as const } },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: adminPaymentInclude,
        orderBy: query.toOrderBy(['createdAt', 'amountMinor']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminPayment), total, query.page, query.limit);
  }

  /** Muhasebe hareketleri değişmezdir; panel bunları yalnızca okur. */
  async listTransactions(
    query: ListAdminTransactionsQueryDto,
  ): Promise<PaginatedResult<AdminTransactionSummary>> {
    const where = {
      ...(query.type ? { type: { in: query.type } } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(query.q ? { description: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: adminTransactionInclude,
        orderBy: query.toOrderBy(['createdAt', 'amountMinor']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminTransaction), total, query.page, query.limit);
  }

  /**
   * Komisyon kuralları.
   *
   * Panelden düzenlenemez: yürürlükteki oran her yeni siparişin tutarını
   * belirler ve geçmişe dönük bir hata para kaybıdır. Değişiklik önce
   * geçerlilik aralığı, önizleme ve denetim kaydıyla birlikte tasarlanmalıdır.
   */
  async listCommissionRules(
    query: ListAdminCommissionsQueryDto,
  ): Promise<PaginatedResult<AdminCommissionRuleSummary>> {
    const where = {
      deletedAt: null,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.commissionRule.findMany({
        where,
        include: adminCommissionInclude,
        orderBy: query.toOrderBy(['priority', 'rateBps', 'createdAt'], { priority: 'desc' }),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.commissionRule.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminCommissionRule), total, query.page, query.limit);
  }

  async listReviews(query: ListAdminReviewsQueryDto): Promise<PaginatedResult<AdminReviewSummary>> {
    const where = {
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.q
        ? {
            OR: [
              { comment: { contains: query.q, mode: 'insensitive' as const } },
              { customer: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
              {
                providerProfile: {
                  OR: [
                    { businessName: { contains: query.q, mode: 'insensitive' as const } },
                    { user: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
                  ],
                },
              },
              {
                order: {
                  jobRequest: { title: { contains: query.q, mode: 'insensitive' as const } },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: adminReviewInclude,
        orderBy: query.toOrderBy(['createdAt', 'overallRating']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toAdminReview), total, query.page, query.limit);
  }

  /**
   * Değerlendirmeyi yayınlar veya gizler.
   *
   * Yayın durumu değişince satıcı ortalama puanı yeniden hesaplanır; aksi halde
   * gizlenen yorum profilde görünmeye devam ederdi.
   */
  async updateReviewModeration(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateReviewModerationDto,
    context: RequestContext,
  ): Promise<AdminReviewSummary> {
    const current = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, providerProfileId: true, moderationNote: true },
    });

    if (!current) throw AppException.notFound('Değerlendirme', id);

    const publishedChanged =
      (current.status === ReviewStatus.PUBLISHED) !== (dto.status === ReviewStatus.PUBLISHED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.review.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.moderationNote !== undefined ? { moderationNote: dto.moderationNote } : {}),
        },
        include: adminReviewInclude,
      });

      if (publishedChanged) {
        await this.refreshProviderRating(tx, current.providerProfileId);
      }

      return row;
    });

    await this.audit.record(
      this.entry(actor, context, {
        action: 'review.moderation.updated',
        entityType: 'Review',
        entityId: id,
        changes: {
          from: current.status,
          to: dto.status,
          moderationNote: dto.moderationNote ?? current.moderationNote ?? null,
        },
      }),
    );

    return toAdminReview(updated);
  }

  async listSettings(): Promise<AdminSystemSetting[]> {
    const rows = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return rows.map(toAdminSystemSetting);
  }

  async updateSetting(
    actor: AuthenticatedUser,
    dto: UpdateSystemSettingDto,
    context: RequestContext,
  ): Promise<AdminSystemSetting> {
    const current = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });

    if (!current) throw AppException.notFound('Sistem ayarı', dto.key);

    if (current.isSecret && dto.value === SECRET_SETTING_MASK) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Gizli ayarın maskelenmiş değeri kaydedilemez; yeni bir değer girin.',
      });
    }

    const updated = await this.prisma.systemSetting.update({
      where: { key: dto.key },
      data: { value: dto.value as Prisma.InputJsonValue },
    });

    await this.audit.record(
      this.entry(actor, context, {
        action: 'setting.updated',
        entityType: 'SystemSetting',
        entityId: updated.id,
        changes: {
          key: dto.key,
          from: current.isSecret ? SECRET_SETTING_MASK : current.value,
          to: current.isSecret ? SECRET_SETTING_MASK : dto.value,
        },
      }),
    );

    return toAdminSystemSetting(updated);
  }

  /** İzin matrisi kodda sabittir; paneli salt okunur yansıtır. */
  listRoleMatrix(): AdminRoleMatrix {
    const roles = Object.values(UserRole).map((role) => ({
      role,
      permissions: [...ROLE_PERMISSIONS[role]],
    }));

    return {
      roles,
      allPermissions: Object.values(Permission),
    };
  }

  async listCategories(): Promise<ServiceCategory[]> {
    const rows = await this.prisma.serviceCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        subcategories: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameTranslations: parseNameTranslations(row.nameTranslations),
      description: row.description,
      iconKey: row.iconKey,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      subcategories: row.subcategories.map((sub) => ({
        id: sub.id,
        categoryId: sub.categoryId,
        slug: sub.slug,
        name: sub.name,
        nameTranslations: parseNameTranslations(sub.nameTranslations),
        sortOrder: sub.sortOrder,
        isActive: sub.isActive,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      })),
    }));
  }

  async createCategory(
    actor: AuthenticatedUser,
    dto: { name: string; slug: string; description?: string; iconKey?: string; sortOrder?: number },
    context: RequestContext,
  ): Promise<ServiceCategory> {
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.prisma.serviceCategory.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new AppException('CONFLICT', {
        message: 'Bu kısa ad zaten kullanılıyor.',
        context: { slug },
      });
    }

    const created = await this.prisma.serviceCategory.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        iconKey: dto.iconKey?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });

    await this.audit.record(
      this.entry(actor, context, {
        action: 'category.created',
        entityType: 'ServiceCategory',
        entityId: created.id,
        changes: { slug: created.slug, name: created.name },
      }),
    );

    return {
      id: created.id,
      slug: created.slug,
      name: created.name,
      nameTranslations: parseNameTranslations(created.nameTranslations),
      description: created.description,
      iconKey: created.iconKey,
      sortOrder: created.sortOrder,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      subcategories: [],
    };
  }

  async updateCategory(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      name?: string;
      description?: string | null;
      iconKey?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
    context: RequestContext,
  ): Promise<ServiceCategory> {
    const current = await this.prisma.serviceCategory.findFirst({
      where: { id, deletedAt: null },
      include: {
        subcategories: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!current) throw AppException.notFound('Kategori', id);

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.iconKey !== undefined ? { iconKey: dto.iconKey?.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        subcategories: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    await this.audit.record(
      this.entry(actor, context, {
        action: 'category.updated',
        entityType: 'ServiceCategory',
        entityId: id,
        changes: {
          before: { name: current.name, isActive: current.isActive },
          after: { name: updated.name, isActive: updated.isActive },
        },
      }),
    );

    return {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      nameTranslations: parseNameTranslations(updated.nameTranslations),
      description: updated.description,
      iconKey: updated.iconKey,
      sortOrder: updated.sortOrder,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      subcategories: updated.subcategories.map((sub) => ({
        id: sub.id,
        categoryId: sub.categoryId,
        slug: sub.slug,
        name: sub.name,
        nameTranslations: parseNameTranslations(sub.nameTranslations),
        sortOrder: sub.sortOrder,
        isActive: sub.isActive,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      })),
    };
  }

  async listSubscriptions() {
    const [plans, subscriptions, wallets] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, code: true, name: true, monthlyCredits: true, isActive: true },
      }),
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          userId: true,
          businessId: true,
          plan: { select: { code: true, name: true } },
        },
      }),
      this.prisma.aiCreditWallet.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          userId: true,
          businessId: true,
          balanceCredits: true,
          periodEnd: true,
        },
      }),
    ]);
    return { plans, subscriptions, wallets };
  }

  async listCommerceRequests() {
    return this.prisma.commerceRequest.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        buyerUserId: true,
        createdAt: true,
        _count: { select: { offers: true, matches: true } },
      },
    });
  }

  async updateContentReport(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateContentReportDto,
    context: RequestContext,
  ): Promise<ContentReport> {
    const current = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!current) throw AppException.notFound('İçerik bildirimi', id);

    const action = dto.action ?? ModerationAction.NONE;
    const nextStatus = action === ModerationAction.NONE ? dto.status : ContentReportStatus.RESOLVED;

    if (action !== ModerationAction.NONE) {
      await this.applyModerationAction(actor, current.targetType, current.targetId, action);
    }

    const updated = await this.prisma.contentReport.update({
      where: { id },
      data: {
        status: nextStatus,
        actionNote: dto.actionNote?.trim() || current.actionNote,
        reviewedAt: new Date(),
      },
    });

    await this.audit.record(
      this.entry(actor, context, {
        action: 'content.report.reviewed',
        entityType: current.targetType,
        entityId: current.targetId,
        changes: {
          reportId: id,
          from: current.status,
          to: nextStatus,
          moderationAction: action,
          actionNote: dto.actionNote ?? null,
        },
      }),
    );

    const [presented] = await this.presentContentReports([updated]);
    if (!presented) throw AppException.notFound('İçerik bildirimi', id);
    return presented;
  }

  async listAiUsage() {
    return this.prisma.aiUsageRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        userId: true,
        businessId: true,
        featureCode: true,
        success: true,
        creditsCharged: true,
        provider: true,
        model: true,
        refundedAt: true,
        createdAt: true,
      },
    });
  }

  async listCampaigns() {
    return this.prisma.b2bCampaign.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        audience: true,
        isActive: true,
        impressionCount: true,
        clickCount: true,
        conversionCount: true,
        business: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  }

  async listContentReports(query?: ListContentReportsQueryDto): Promise<ContentReport[]> {
    const q = query?.q?.trim();
    const rows = await this.prisma.contentReport.findMany({
      where: {
        ...(query?.status ? { status: query.status } : {}),
        ...(query?.targetType ? { targetType: query.targetType } : {}),
        ...(q
          ? {
              OR: [
                { reason: { contains: q, mode: 'insensitive' } },
                { actionNote: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { reporter: { select: { fullName: true } } },
    });
    return this.presentContentReports(rows);
  }

  async bulkUpdateContentReports(
    actor: AuthenticatedUser,
    dto: BulkContentReportDto,
    context: RequestContext,
  ): Promise<{ updated: number }> {
    let updated = 0;
    for (const id of dto.ids) {
      await this.updateContentReport(
        actor,
        id,
        { status: dto.status, action: dto.action, actionNote: dto.actionNote },
        context,
      );
      updated += 1;
    }
    return { updated };
  }

  async listFraudFlags(status?: string) {
    const statusFilter = Object.values(FraudFlagStatus).includes(status as FraudFlagStatus)
      ? (status as FraudFlagStatus)
      : undefined;
    return this.prisma.fraudFlag.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateFraudFlag(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateFraudFlagDto,
    context: RequestContext,
  ) {
    const current = await this.prisma.fraudFlag.findUnique({ where: { id } });
    if (!current) throw AppException.notFound('Dolandırıcılık bayrağı', id);
    const updated = await this.prisma.fraudFlag.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.note ? { note: dto.note } : {}),
      },
    });
    await this.audit.record(
      this.entry(actor, context, {
        action: 'fraud.flag.updated',
        entityType: 'FraudFlag',
        entityId: id,
        changes: { from: current.status, to: dto.status, note: dto.note ?? null },
      }),
    );
    return updated;
  }

  async getBackupStatus() {
    const keys = [
      'ops.backup.last_verified_at',
      'ops.backup.last_verified_by',
      'ops.backup.last_note',
    ];
    const rows = await this.prisma.systemSetting.findMany({ where: { key: { in: keys } } });
    const map = new Map(rows.map((row) => [row.key, row.value]));
    // Ayar değerleri JSON; metin bekleyen alanlarda yalnızca string kabul edilir.
    const readText = (key: string): string | null => {
      const value = map.get(key);
      return typeof value === 'string' ? value : null;
    };

    return {
      lastVerifiedAt: readText('ops.backup.last_verified_at'),
      lastVerifiedBy: readText('ops.backup.last_verified_by'),
      lastNote: readText('ops.backup.last_note'),
      checklist: [
        'PostgreSQL dump alındı ve dosya boyutu > 0',
        'Dump ayrı bir ortamda restore denendi',
        'MinIO / S3 kova yedeği doğrulandı',
        'Geri yükleme sonrası migrate deploy çalıştı',
      ],
      runbook: 'docs/28-backup-runbook.md',
      claimedAutomaticBackup: false,
    };
  }

  async verifyBackup(actor: AuthenticatedUser, dto: VerifyBackupDto, context: RequestContext) {
    const at = new Date().toISOString();
    await Promise.all(
      [
        { key: 'ops.backup.last_verified_at', value: at },
        { key: 'ops.backup.last_verified_by', value: actor.id },
        { key: 'ops.backup.last_note', value: dto.note?.trim() || 'Runbook doğrulandı' },
      ].map((item) =>
        this.prisma.systemSetting.upsert({
          where: { key: item.key },
          create: { key: item.key, value: item.value, isSecret: false },
          update: { value: item.value },
        }),
      ),
    );
    await this.audit.record(
      this.entry(actor, context, {
        action: 'backup.verified',
        entityType: 'SystemSetting',
        entityId: 'ops.backup',
        changes: { at, note: dto.note ?? null },
      }),
    );
    return this.getBackupStatus();
  }

  /**
   * Satıcının ortalama puanı yayınlanmış yorumlardan yeniden hesaplanır.
   * Sayaç körlemesine artırılmaz; gizlenen yorum profili şişirmez.
   */
  private async refreshProviderRating(
    tx: Prisma.TransactionClient,
    providerProfileId: string,
  ): Promise<void> {
    const aggregate = await tx.review.aggregate({
      where: { providerProfileId, status: ReviewStatus.PUBLISHED, deletedAt: null },
      _avg: { overallRating: true },
      _count: { _all: true },
    });

    const average = aggregate._avg.overallRating;

    await tx.providerProfile.update({
      where: { id: providerProfileId },
      data: {
        averageRating: average === null ? null : Math.round(Number(average) * 100) / 100,
        reviewCount: aggregate._count._all,
      },
    });
  }

  private async applyModerationAction(
    actor: AuthenticatedUser,
    targetType: string,
    targetId: string,
    action: ModerationAction,
  ): Promise<void> {
    const subject = await this.loadModerationSubject(targetType, targetId);
    if (!subject) throw AppException.notFound('Bildirilen içerik', targetId);

    if (
      action === ModerationAction.REMOVE_CONTENT ||
      action === ModerationAction.SUSPEND_AUTHOR ||
      action === ModerationAction.BAN_AUTHOR
    ) {
      if (subject.kind === 'POST' && !subject.removed) {
        await this.prisma.$transaction(async (tx) => {
          await tx.post.update({ where: { id: subject.id }, data: { deletedAt: new Date() } });
          await tx.feedItem.deleteMany({ where: { postId: subject.id } });
          await tx.socialProfile.update({
            where: { id: subject.authorProfileId },
            data: { postCount: { decrement: 1 } },
          });
        });
      }
      if (subject.kind === 'COMMENT' && !subject.removed) {
        await this.prisma.$transaction(async (tx) => {
          await tx.postComment.update({
            where: { id: subject.id },
            data: { deletedAt: new Date() },
          });
          await tx.post.update({
            where: { id: subject.postId },
            data: { commentCount: { decrement: 1 } },
          });
        });
      }
    }

    if (action === ModerationAction.SUSPEND_AUTHOR || action === ModerationAction.BAN_AUTHOR) {
      if (!subject.authorUserId) {
        throw new AppException('VALIDATION_ERROR', {
          message: 'Bu içeriğin bağlı bir hesabı yok; yalnızca içerik kaldırılabilir.',
        });
      }
      await this.updateUserStatus(
        actor,
        subject.authorUserId,
        {
          status: action === ModerationAction.BAN_AUTHOR ? UserStatus.BANNED : UserStatus.SUSPENDED,
        },
        { ipAddress: undefined, userAgent: undefined },
      );
    }
  }

  private async loadModerationSubject(targetType: string, targetId: string) {
    if (targetType === ContentReportTarget.POST) {
      const post = await this.prisma.post.findFirst({
        where: { id: targetId },
        select: {
          id: true,
          deletedAt: true,
          authorProfileId: true,
          author: { select: { userId: true, business: { select: { ownerUserId: true } } } },
        },
      });
      if (!post) return null;
      return {
        kind: 'POST' as const,
        id: post.id,
        removed: Boolean(post.deletedAt),
        authorProfileId: post.authorProfileId,
        authorUserId: post.author.userId ?? post.author.business?.ownerUserId ?? null,
        postId: post.id,
      };
    }
    if (targetType === ContentReportTarget.COMMENT) {
      const comment = await this.prisma.postComment.findFirst({
        where: { id: targetId },
        select: {
          id: true,
          postId: true,
          deletedAt: true,
          authorProfileId: true,
          author: { select: { userId: true, business: { select: { ownerUserId: true } } } },
        },
      });
      if (!comment) return null;
      return {
        kind: 'COMMENT' as const,
        id: comment.id,
        removed: Boolean(comment.deletedAt),
        authorProfileId: comment.authorProfileId,
        authorUserId: comment.author.userId ?? comment.author.business?.ownerUserId ?? null,
        postId: comment.postId,
      };
    }
    const profile = await this.prisma.socialProfile.findFirst({
      where: { id: targetId },
      select: {
        id: true,
        deletedAt: true,
        userId: true,
        business: { select: { ownerUserId: true } },
      },
    });
    if (!profile) return null;
    return {
      kind: 'PROFILE' as const,
      id: profile.id,
      removed: Boolean(profile.deletedAt),
      authorProfileId: profile.id,
      authorUserId: profile.userId ?? profile.business?.ownerUserId ?? null,
      postId: '',
    };
  }

  private async presentContentReports(
    rows: Array<{
      id: string;
      reporterUserId: string;
      targetType: string;
      targetId: string;
      reason: string;
      status: string;
      actionNote: string | null;
      reviewedAt: Date | null;
      createdAt: Date;
      reporter?: { fullName: string } | null;
    }>,
  ): Promise<ContentReport[]> {
    const postIds = rows
      .filter((row) => row.targetType === ContentReportTarget.POST)
      .map((row) => row.targetId);
    const commentIds = rows
      .filter((row) => row.targetType === ContentReportTarget.COMMENT)
      .map((row) => row.targetId);
    const profileIds = rows
      .filter((row) => row.targetType === ContentReportTarget.PROFILE)
      .map((row) => row.targetId);

    const [posts, comments, profiles] = await Promise.all([
      postIds.length
        ? this.prisma.post.findMany({
            where: { id: { in: postIds } },
            select: {
              id: true,
              body: true,
              deletedAt: true,
              author: {
                select: {
                  userId: true,
                  username: true,
                  displayName: true,
                  business: { select: { ownerUserId: true } },
                },
              },
              media: { take: 1, select: { file: { select: { storageKey: true } } } },
            },
          })
        : [],
      commentIds.length
        ? this.prisma.postComment.findMany({
            where: { id: { in: commentIds } },
            select: {
              id: true,
              body: true,
              deletedAt: true,
              author: {
                select: {
                  userId: true,
                  username: true,
                  displayName: true,
                  business: { select: { ownerUserId: true } },
                },
              },
            },
          })
        : [],
      profileIds.length
        ? this.prisma.socialProfile.findMany({
            where: { id: { in: profileIds } },
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              deletedAt: true,
              userId: true,
              business: { select: { ownerUserId: true } },
            },
          })
        : [],
    ]);

    const postMap = new Map(posts.map((item) => [item.id, item]));
    const commentMap = new Map(comments.map((item) => [item.id, item]));
    const profileMap = new Map(profiles.map((item) => [item.id, item]));

    return rows.map((row) => {
      let target: ContentReport['target'] = null;
      if (row.targetType === ContentReportTarget.POST) {
        const post = postMap.get(row.targetId);
        target = post
          ? {
              preview: post.body?.trim() || '(görsel / fırsat gönderisi)',
              mediaUrl: post.media[0]?.file?.storageKey
                ? resolveAssetUrl(this.config.fileBaseUrl, post.media[0].file.storageKey)
                : null,
              authorUserId: post.author.userId ?? post.author.business?.ownerUserId ?? null,
              authorName: post.author.displayName,
              authorUsername: post.author.username,
              removed: Boolean(post.deletedAt),
            }
          : { preview: 'Gönderi bulunamadı', removed: true };
      } else if (row.targetType === ContentReportTarget.COMMENT) {
        const comment = commentMap.get(row.targetId);
        target = comment
          ? {
              preview: comment.body,
              authorUserId: comment.author.userId ?? comment.author.business?.ownerUserId ?? null,
              authorName: comment.author.displayName,
              authorUsername: comment.author.username,
              removed: Boolean(comment.deletedAt),
            }
          : { preview: 'Yorum bulunamadı', removed: true };
      } else {
        const profile = profileMap.get(row.targetId);
        target = profile
          ? {
              preview: profile.bio?.trim() || `@${profile.username}`,
              authorUserId: profile.userId ?? profile.business?.ownerUserId ?? null,
              authorName: profile.displayName,
              authorUsername: profile.username,
              removed: Boolean(profile.deletedAt),
            }
          : { preview: 'Profil bulunamadı', removed: true };
      }

      return {
        id: row.id,
        reporterUserId: row.reporterUserId,
        reporterName: row.reporter?.fullName ?? null,
        targetType: row.targetType as ContentReport['targetType'],
        targetId: row.targetId,
        reason: row.reason,
        status: row.status as ContentReport['status'],
        actionNote: row.actionNote,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        target,
      };
    });
  }

  private entry(
    actor: AuthenticatedUser,
    context: RequestContext,
    input: Omit<AuditEntryInput, 'actorId' | 'ipAddress' | 'userAgent'>,
  ): AuditEntryInput {
    return {
      ...input,
      actorId: actor.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    };
  }
}

function isStaffRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
}
