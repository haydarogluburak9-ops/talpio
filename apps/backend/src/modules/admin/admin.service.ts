import { Injectable } from '@nestjs/common';
import {
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
  type AdminCommissionRuleSummary,
  type AdminDashboard,
  type AdminJobSummary,
  type AdminOfferSummary,
  type AdminOrderSummary,
  type AdminPaymentSummary,
  type AdminProviderSummary,
  type AdminTransactionSummary,
  type AdminUserSummary,
} from '@ustapilot/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import {
  adminCommissionInclude,
  adminJobInclude,
  adminOfferInclude,
  adminOrderInclude,
  adminPaymentInclude,
  adminProviderInclude,
  adminTransactionInclude,
  adminUserInclude,
  toAdminCommissionRule,
  toAdminJob,
  toAdminOffer,
  toAdminOrder,
  toAdminPayment,
  toAdminProvider,
  toAdminTransaction,
  toAdminUser,
} from './admin.mapper';
import { AuditLogService, type AuditEntryInput } from './audit-log.service';
import type {
  ListAdminCommissionsQueryDto,
  ListAdminJobsQueryDto,
  ListAdminOffersQueryDto,
  ListAdminOrdersQueryDto,
  ListAdminPaymentsQueryDto,
  ListAdminProvidersQueryDto,
  ListAdminTransactionsQueryDto,
  ListAdminUsersQueryDto,
  UpdateUserStatusDto,
  UpdateVerificationDto,
} from './dto/admin-query.dto';

/** Panelde "açık" sayılan talep durumları: henüz bir usta üstlenmemiş işler. */
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
  ) {}

  /**
   * Panelin özet kartları.
   *
   * Tüm sayımlar tek turda paralel çalıştırılır; sıralı beklenirse panel
   * açılışı sayım sayısı kadar gecikirdi.
   */
  async dashboard(): Promise<AdminDashboard> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUser = { deletedAt: null };

    const [
      totalUsers,
      customers,
      providers,
      newThisWeek,
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
      users: { total: totalUsers, customers, providers, newThisWeek },
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
      await this.prisma.userSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
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
   * Usta doğrulama kararını uygular.
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
      select: { id: true, verificationStatus: true },
    });

    if (!current) throw AppException.notFound('Usta profili', id);

    const approved = dto.verificationStatus === VerificationStatus.VERIFIED;
    const reviewedAt = new Date();

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
          ...(approved ? {} : { rejectionReason: dto.reason ?? 'Belge kabul edilmedi.' }),
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

    return toAdminProvider(updated, this.config.fileBaseUrl);
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
