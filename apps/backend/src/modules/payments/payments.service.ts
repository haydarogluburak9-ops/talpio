import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderStatus, UserRole, type Payment, type Transaction } from '@talpio/types';
import type { ProviderWalletSummary } from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaymentStatus, TransactionType } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import {
  PAYMENT_PROVIDER,
  type PaymentOutcome,
  type PaymentProvider,
  type WebhookRequest,
} from '@infra/payments/payment-provider';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { syncJobStatus } from '@modules/orders/job-status.sync';

import type { ListPaymentsQueryDto, ListTransactionsQueryDto } from './dto/list-payments-query.dto';
import type { RefundPaymentDto } from './dto/refund-payment.dto';
import { toPayment, toTransaction, toWalletSummary, type PaymentRow } from './payment.mapper';

const SORTABLE_PAYMENT_FIELDS = ['createdAt', 'amountMinor'] as const;

/**
 * Personelin iade edebileceği sipariş durumları ve iade sonrası varacakları
 * durum. Onaylanmış işte hakediş satıcının kullanılabilir bakiyesine geçtiği
 * için tek yanlı geri alınamaz; itiraz akışı ayrı yürür.
 */
const REFUND_TARGET_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PAID]: OrderStatus.CANCELLED,
  [OrderStatus.DISPUTED]: OrderStatus.REFUNDED,
};

/** Sağlayıcı çağrısı için gereken, sipariş kaydından bağımsız ödeme bağlamı. */
export interface ChargeIntent {
  orderId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string | null;
}

/** Cüzdan hareketleri için siparişten okunan alanlar. */
export interface PayoutContext {
  id: string;
  providerProfileId: string;
  payoutMinor: number;
  commissionMinor: number;
  currency: string;
}

/** Sağlayıcı iadeyi kabul ettikten sonra veritabanına yazılacak bilgi. */
export interface RefundTicket {
  paymentId: string;
  amountMinor: number;
  currency: string;
}

const orderForRefund = {
  id: true,
  status: true,
  currency: true,
  payoutMinor: true,
  commissionMinor: true,
  providerProfileId: true,
  jobRequestId: true,
  jobRequest: { select: { status: true } },
} satisfies Prisma.OrderSelect;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditLogService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  // -------------------------------------------------------------------------
  // Sağlayıcı çağrıları — veritabanına dokunmaz
  // -------------------------------------------------------------------------

  /**
   * Provizyon alıp tahsil eder.
   *
   * Çağıranın veritabanı işleminin dışında çalışmalıdır: dış servis beklenirken
   * satır kilidi tutmak, yavaş bir sağlayıcıda tüm sipariş akışını durdurur.
   */
  async charge(intent: ChargeIntent): Promise<PaymentOutcome> {
    const authorized = await this.provider.authorize({
      orderId: intent.orderId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      idempotencyKey: intent.idempotencyKey,
    });

    if (authorized.status !== PaymentStatus.AUTHORIZED || !authorized.providerReference) {
      return authorized;
    }

    return this.provider.capture({
      providerReference: authorized.providerReference,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
    });
  }

  /**
   * Başarısız denemeyi kalıcı kılar.
   *
   * Çağıranın işleminin dışında yazılır; sipariş güncellemesi geri alındığında
   * bu kaydın da silinmesi, müşterinin neden ödeyemediğini kaybetmek olurdu.
   * İstemci anahtarı bilerek boş bırakılır: para hareketi olmadığı için aynı
   * anahtarla tekrar denenebilmelidir.
   */
  async recordFailure(intent: ChargeIntent, outcome: PaymentOutcome): Promise<void> {
    await this.prisma.payment.create({
      data: {
        orderId: intent.orderId,
        status: PaymentStatus.FAILED,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        providerName: this.provider.name,
        providerReference: outcome.providerReference,
        failureReason: outcome.failureReason ?? 'Ödeme sağlayıcısı işlemi reddetti.',
      },
    });
  }

  // -------------------------------------------------------------------------
  // Defter yazımı — çağıranın işlemi içinde çalışır
  // -------------------------------------------------------------------------

  async recordCapture(
    tx: Prisma.TransactionClient,
    intent: ChargeIntent,
    outcome: PaymentOutcome,
  ): Promise<void> {
    const now = new Date();

    const payment = await tx.payment.create({
      data: {
        orderId: intent.orderId,
        status: PaymentStatus.CAPTURED,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        providerName: this.provider.name,
        providerReference: outcome.providerReference,
        idempotencyKey: intent.idempotencyKey,
        authorizedAt: now,
        capturedAt: now,
      },
    });

    await tx.transaction.create({
      data: {
        paymentId: payment.id,
        orderId: intent.orderId,
        type: TransactionType.PAYMENT,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        description: 'Sipariş ödemesi tahsil edildi',
      },
    });
  }

  /** Ödeme alındığında hakediş cüzdanda bloke edilir. */
  async holdPayout(tx: Prisma.TransactionClient, order: PayoutContext): Promise<void> {
    await tx.providerWallet.upsert({
      where: { providerProfileId: order.providerProfileId },
      create: {
        providerProfileId: order.providerProfileId,
        currency: order.currency,
        pendingMinor: order.payoutMinor,
      },
      update: { pendingMinor: { increment: order.payoutMinor } },
    });
  }

  /** Onayla birlikte bloke tutar kullanılabilir bakiyeye geçer. */
  async releasePayout(tx: Prisma.TransactionClient, order: PayoutContext): Promise<void> {
    const wallet = await tx.providerWallet.update({
      where: { providerProfileId: order.providerProfileId },
      data: {
        pendingMinor: { decrement: order.payoutMinor },
        balanceMinor: { increment: order.payoutMinor },
      },
    });

    await tx.transaction.create({
      data: {
        orderId: order.id,
        walletId: wallet.id,
        type: TransactionType.PAYOUT,
        amountMinor: order.payoutMinor,
        currency: order.currency,
        balanceAfterMinor: wallet.balanceMinor,
        description: 'Hakediş serbest bırakıldı',
      },
    });

    await tx.transaction.create({
      data: {
        orderId: order.id,
        type: TransactionType.COMMISSION,
        amountMinor: -order.commissionMinor,
        currency: order.currency,
        description: 'Platform komisyonu',
      },
    });
  }

  /** İptal ve iadede bloke hakediş geri alınır. */
  async releaseHold(tx: Prisma.TransactionClient, order: PayoutContext): Promise<void> {
    await tx.providerWallet.updateMany({
      where: { providerProfileId: order.providerProfileId },
      data: { pendingMinor: { decrement: order.payoutMinor } },
    });
  }

  /**
   * Siparişin tahsil edilmiş ödemesini sağlayıcıda iade eder.
   *
   * Tahsilat yoksa `null` döner: ödenmemiş bir siparişin iptalinde iade
   * edilecek bir şey yoktur.
   */
  async prepareRefund(orderId: string, reason?: string | null): Promise<RefundTicket | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.CAPTURED },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) return null;

    return this.callRefund(payment, reason);
  }

  /**
   * İadeyi deftere işler.
   *
   * Muhasebe kaydı güncellenmez; para çıkışı negatif tutarlı ters kayıtla
   * eklenir.
   */
  async recordRefund(
    tx: Prisma.TransactionClient,
    ticket: RefundTicket,
    orderId: string,
  ): Promise<void> {
    await tx.payment.update({
      where: { id: ticket.paymentId },
      data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        paymentId: ticket.paymentId,
        orderId,
        type: TransactionType.REFUND,
        amountMinor: -ticket.amountMinor,
        currency: ticket.currency,
        description: 'Sipariş ödemesi iade edildi',
      },
    });
  }

  // -------------------------------------------------------------------------
  // Uçlar
  // -------------------------------------------------------------------------

  /**
   * Oturumdaki tarafın ödemeleri.
   *
   * Müşteri kendi ödemelerini, satıcı üstlendiği siparişlerin ödemelerini görür;
   * personel için süzgeç uygulanmaz.
   */
  async listMine(
    user: AuthenticatedUser,
    query: ListPaymentsQueryDto,
  ): Promise<PaginatedResult<Payment>> {
    const where: Prisma.PaymentWhereInput = {
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(await this.paymentScope(user)),
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: query.toOrderBy(SORTABLE_PAYMENT_FIELDS),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toPayment), total, query.page, query.limit);
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Payment> {
    const row = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: { select: { customerId: true, providerProfile: { select: { userId: true } } } },
      },
    });

    if (!row) throw AppException.notFound('Ödeme', id);

    const isOwner = row.order.customerId === user.id;
    const isProvider = row.order.providerProfile.userId === user.id;

    if (!isOwner && !isProvider && !isStaff(user.role)) {
      throw AppException.forbiddenResource('Ödeme', { paymentId: id });
    }

    return toPayment(row);
  }

  /**
   * Muhasebe hareketleri.
   *
   * Müşteri kendi ödeme ve iade kayıtlarını, satıcı cüzdan hareketleriyle
   * siparişlerinden kesilen komisyonu görür.
   */
  async listTransactions(
    user: AuthenticatedUser,
    query: ListTransactionsQueryDto,
  ): Promise<PaginatedResult<Transaction>> {
    const where: Prisma.TransactionWhereInput = {
      ...(query.type?.length ? { type: { in: query.type } } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(await this.transactionScope(user)),
    };

    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: query.toOrderBy(['createdAt']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toTransaction), total, query.page, query.limit);
  }

  async walletSummary(user: AuthenticatedUser): Promise<ProviderWalletSummary> {
    const profile = await this.requireProviderProfile(user.id);

    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerProfileId: profile.id },
    });

    return toWalletSummary(wallet, this.config.payment.currency);
  }

  /**
   * Sağlayıcı geri bildirimi.
   *
   * Gövdeye imza doğrulanmadan güvenilmez. Aynı olay iki kez geldiğinde ikinci
   * çağrı ödemenin mevcut durumuna bakılarak yutulur; muhasebe hareketi bir kez
   * yazılır.
   */
  async handleWebhook(request: WebhookRequest): Promise<{ applied: boolean }> {
    const event = this.provider.parseWebhook(request);
    const payloadHash = createHash('sha256').update(request.rawBody).digest('hex');

    try {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          providerName: this.provider.name,
          eventId: event.eventId,
          payloadHash,
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return { applied: false };
      }
      throw error;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerReference: event.providerReference },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      // Bilinmeyen referans reddedilmez: imza geçerliyse istek sağlayıcıdan
      // gelmiştir ve tekrar denenmesi bir işe yaramaz.
      this.logger.warn(
        { providerReference: event.providerReference, eventId: event.eventId },
        'Webhook olayı eşleşen ödeme bulamadı',
      );
      return { applied: false };
    }

    if (payment.status === event.status) return { applied: false };

    switch (event.status) {
      case PaymentStatus.CAPTURED:
        return this.applyWebhookCapture(payment);
      case PaymentStatus.FAILED:
        return this.applyWebhookFailure(payment, event.failureReason);
      case PaymentStatus.REFUNDED:
        return this.applyWebhookRefund(payment);
      default:
        return { applied: false };
    }
  }

  /**
   * Personel iadesi.
   *
   * Müşteri iadeyi tek başına başlatamaz: iş başladıktan sonra hizmeti alıp
   * parayı geri çekebilirdi. Ödeme öncesi ve sonrası iptal hakkı zaten
   * `POST /orders/:id/cancel` ile taraflardadır; buradaki uç, iptal penceresi
   * dışındaki durumlar için destek/yönetim kararıdır.
   */
  async refund(actor: AuthenticatedUser, id: string, dto: RefundPaymentDto): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: { select: orderForRefund } },
    });

    if (!payment) throw AppException.notFound('Ödeme', id);

    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new AppException('PAYMENT_NOT_REFUNDABLE', {
        message: 'Yalnızca tahsil edilmiş ödemeler iade edilebilir.',
        context: { paymentId: id, status: payment.status },
      });
    }

    const order = payment.order;
    const targetStatus = REFUND_TARGET_STATUS[order.status];

    if (!targetStatus) {
      throw new AppException('PAYMENT_NOT_REFUNDABLE', {
        message: 'Bu siparişin durumunda iade yapılamaz.',
        context: { paymentId: id, orderStatus: order.status },
      });
    }

    const ticket = await this.callRefund(payment, dto.reason);

    const refunded = await this.prisma.$transaction(async (tx) => {
      await this.recordRefund(tx, ticket, order.id);
      await this.releaseHold(tx, order);

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          cancelledAt: new Date(),
          cancellationReason: dto.reason ?? 'Ödeme iade edildi',
        },
      });

      if (order.jobRequestId && order.jobRequest) {
        await syncJobStatus(
          tx,
          { jobRequestId: order.jobRequestId, jobStatus: order.jobRequest.status },
          targetStatus,
          actor.id,
          dto.reason ?? 'Ödeme iade edildi',
        );
      }

      return tx.payment.findUniqueOrThrow({ where: { id } });
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'payment.refunded',
      entityType: 'Payment',
      entityId: id,
      changes: {
        orderId: order.id,
        amountMinor: ticket.amountMinor,
        reason: dto.reason ?? null,
      },
    });

    return toPayment(refunded);
  }

  // -------------------------------------------------------------------------

  private async callRefund(payment: PaymentRow, reason?: string | null): Promise<RefundTicket> {
    const outcome = await this.provider.refund({
      providerReference: payment.providerReference ?? payment.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      reason: reason ?? null,
    });

    // Sağlayıcı iadeyi kabul etmediyse sipariş kapatılmaz: müşterinin parası
    // hâlâ platformdadır ve kaydın ödenmiş görünmeye devam etmesi gerekir.
    if (outcome.status !== PaymentStatus.REFUNDED) {
      throw new AppException('PAYMENT_FAILED', {
        message: outcome.failureReason ?? 'İade sağlayıcı tarafından reddedildi.',
        context: { paymentId: payment.id },
      });
    }

    return {
      paymentId: payment.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
    };
  }

  private async applyWebhookCapture(payment: PaymentRow): Promise<{ applied: boolean }> {
    // Tahsilat zaten kapanmışsa geri sarılmaz; iade edilmiş ödeme yeniden
    // tahsil edilmiş sayılamaz.
    if (payment.status === PaymentStatus.REFUNDED || payment.status === PaymentStatus.FAILED) {
      return { applied: false };
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          capturedAt: payment.capturedAt ?? now,
          authorizedAt: payment.authorizedAt ?? now,
        },
      });

      await tx.transaction.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          type: TransactionType.PAYMENT,
          amountMinor: payment.amountMinor,
          currency: payment.currency,
          description: 'Sağlayıcı tahsilatı doğruladı',
        },
      });
    });

    return { applied: true };
  }

  private async applyWebhookFailure(
    payment: PaymentRow,
    failureReason: string | null,
  ): Promise<{ applied: boolean }> {
    if (payment.status === PaymentStatus.CAPTURED || payment.status === PaymentStatus.REFUNDED) {
      return { applied: false };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: failureReason ?? 'Sağlayıcı ödemeyi reddetti.',
      },
    });

    return { applied: true };
  }

  private async applyWebhookRefund(payment: PaymentRow): Promise<{ applied: boolean }> {
    if (payment.status !== PaymentStatus.CAPTURED) return { applied: false };

    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      select: orderForRefund,
    });

    if (!order) return { applied: false };

    await this.prisma.$transaction(async (tx) => {
      await this.recordRefund(
        tx,
        {
          paymentId: payment.id,
          amountMinor: payment.amountMinor,
          currency: payment.currency,
        },
        payment.orderId,
      );

      if (order.status === OrderStatus.PAID) {
        await this.releaseHold(tx, order);
      }
    });

    return { applied: true };
  }

  private async paymentScope(user: AuthenticatedUser): Promise<Prisma.PaymentWhereInput> {
    if (isStaff(user.role)) return {};

    if (user.role === UserRole.PROVIDER) {
      const profile = await this.requireProviderProfile(user.id);
      return { order: { providerProfileId: profile.id } };
    }

    return { order: { customerId: user.id } };
  }

  private async transactionScope(user: AuthenticatedUser): Promise<Prisma.TransactionWhereInput> {
    if (isStaff(user.role)) return {};

    if (user.role === UserRole.PROVIDER) {
      const profile = await this.requireProviderProfile(user.id);
      return {
        OR: [
          { wallet: { providerProfileId: profile.id } },
          {
            order: { providerProfileId: profile.id },
            type: { in: [TransactionType.COMMISSION, TransactionType.PAYOUT] },
          },
        ],
      };
    }

    // Müşteri yalnızca kendi cebinden çıkan ve cebine dönen hareketleri görür;
    // komisyon ve hakediş ustayla platform arasındaki paylaşımdır.
    return {
      order: { customerId: user.id },
      type: { in: [TransactionType.PAYMENT, TransactionType.REFUND] },
    };
  }

  private async requireProviderProfile(userId: string): Promise<{ id: string }> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      throw new AppException('PROVIDER_PROFILE_INCOMPLETE', {
        message: 'Bu işlem için satıcı profiliniz olmalıdır.',
      });
    }

    return profile;
  }
}

function isStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
}
