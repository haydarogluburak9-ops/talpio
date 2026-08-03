import { Injectable } from '@nestjs/common';
import { canTransitionJobStatus, canTransitionOrderStatus } from '@ustapilot/business-logic';
import { JobRequestStatus, OrderStatus, UserRole, type Order } from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaymentStatus, TransactionType } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { CancelOrderDto, CompleteOrderDto, PayOrderDto } from './dto/order-action.dto';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { orderInclude, toOrder, type OrderRow } from './order.mapper';

const SORTABLE_FIELDS = ['createdAt', 'scheduledAt', 'updatedAt'] as const;

/** Siparişin iptal edilebildiği durumlar. İş başladıktan sonra iptal yerine anlaşmazlık açılır. */
const CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID];

/**
 * Siparişin durumu ile işin durumu birlikte ilerler. İş akışı müşteri ve usta
 * ekranlarında talep üzerinden okunduğu için ikisi ayrı düşmemelidir.
 */
const JOB_STATUS_FOR_ORDER: Partial<Record<OrderStatus, JobRequestStatus>> = {
  [OrderStatus.PAID]: JobRequestStatus.SCHEDULED,
  [OrderStatus.IN_PROGRESS]: JobRequestStatus.IN_PROGRESS,
  [OrderStatus.AWAITING_APPROVAL]: JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
  [OrderStatus.COMPLETED]: JobRequestStatus.COMPLETED,
  [OrderStatus.CANCELLED]: JobRequestStatus.CANCELLED,
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Oturumdaki tarafın siparişleri.
   *
   * Müşteri kendi verdiği işleri, usta üstlendiği işleri görür; personel için
   * süzgeç uygulanmaz.
   */
  async listMine(
    user: AuthenticatedUser,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedResult<Order>> {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.jobRequestId ? { jobRequestId: query.jobRequestId } : {}),
      ...(await this.scopeFor(user)),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: query.toOrderBy(SORTABLE_FIELDS),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => this.present(row, true)),
      total,
      query.page,
      query.limit,
    );
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Order> {
    const row = await this.requireVisibleOrder(user, id);
    return this.present(row, true);
  }

  /**
   * Müşteri ödemeyi tamamlar.
   *
   * Ödeme sağlayıcısı henüz bağlı değildir; kayıt "mock" sağlayıcıyla açılır ve
   * anında tahsil edilmiş sayılır. Hakediş, iş onaylanana kadar ustanın
   * cüzdanında bloke tutulur.
   */
  async pay(user: AuthenticatedUser, id: string, dto: PayOrderDto): Promise<Order> {
    const row = await this.requireOwnOrderAsCustomer(user, id);

    // Anahtar kontrolü durum kontrolünden önce gelir: ağ tekrarı yüzünden aynı
    // isteğin ikinci kez gelmesi hata değil, ilk sonucun tekrarıdır.
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        select: { orderId: true },
      });

      if (existing) {
        if (existing.orderId !== id) {
          throw new AppException('PAYMENT_ALREADY_PROCESSED', {
            message: 'Bu ödeme anahtarı başka bir sipariş için kullanılmış.',
          });
        }

        return this.present(row, true);
      }
    }

    this.assertTransition(row.status, OrderStatus.PAID);

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: id,
          status: PaymentStatus.CAPTURED,
          amountMinor: row.totalMinor,
          currency: row.currency,
          providerName: 'mock',
          providerReference: `mock_${id}`,
          idempotencyKey: dto.idempotencyKey ?? null,
          authorizedAt: now,
          capturedAt: now,
        },
      });

      await tx.transaction.create({
        data: {
          paymentId: payment.id,
          orderId: id,
          type: TransactionType.PAYMENT,
          amountMinor: row.totalMinor,
          currency: row.currency,
          description: 'Sipariş ödemesi tahsil edildi',
        },
      });

      await this.holdPayout(tx, row);

      const order = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.PAID,
          ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        },
        include: orderInclude,
      });

      await this.syncJobStatus(tx, row, OrderStatus.PAID, user.id, 'Ödeme alındı');

      return order;
    });

    return this.present(updated, true);
  }

  /** Usta işe başladığını bildirir. */
  async start(user: AuthenticatedUser, id: string): Promise<Order> {
    const row = await this.requireOwnOrderAsProvider(user, id);
    this.assertTransition(row.status, OrderStatus.IN_PROGRESS);

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.IN_PROGRESS, startedAt: new Date() },
        include: orderInclude,
      });

      await this.syncJobStatus(tx, row, OrderStatus.IN_PROGRESS, user.id, 'Usta işe başladı');

      return order;
    });

    return this.present(updated, true);
  }

  /** Usta işi bitirir; müşterinin onayı beklenir. */
  async complete(user: AuthenticatedUser, id: string, dto: CompleteOrderDto): Promise<Order> {
    const row = await this.requireOwnOrderAsProvider(user, id);
    this.assertTransition(row.status, OrderStatus.AWAITING_APPROVAL);

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.AWAITING_APPROVAL, completedAt: new Date() },
        include: orderInclude,
      });

      await this.syncJobStatus(
        tx,
        row,
        OrderStatus.AWAITING_APPROVAL,
        user.id,
        dto.note ?? 'Usta işi tamamladı',
      );

      return order;
    });

    return this.present(updated, true);
  }

  /**
   * Müşteri işi onaylar.
   *
   * Onayla birlikte bloke hakediş ustanın kullanılabilir bakiyesine geçer ve
   * tamamlanan iş sayaçları artar.
   */
  async approve(user: AuthenticatedUser, id: string): Promise<Order> {
    const row = await this.requireOwnOrderAsCustomer(user, id);
    this.assertTransition(row.status, OrderStatus.COMPLETED);

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.COMPLETED, approvedAt: now },
        include: orderInclude,
      });

      await this.releasePayout(tx, row);

      await tx.providerProfile.update({
        where: { id: row.providerProfileId },
        data: { completedJobCount: { increment: 1 } },
      });

      await tx.customerProfile.updateMany({
        where: { userId: row.customerId },
        data: { completedJobCount: { increment: 1 } },
      });

      await this.syncJobStatus(tx, row, OrderStatus.COMPLETED, user.id, 'Müşteri işi onayladı');

      return order;
    });

    return this.present(updated, true);
  }

  /** İş başlamadan önce her iki taraf da siparişi iptal edebilir. */
  async cancel(user: AuthenticatedUser, id: string, dto: CancelOrderDto): Promise<Order> {
    const row = await this.requireVisibleOrder(user, id, { staffAllowed: false });

    if (!CANCELLABLE.includes(row.status)) {
      throw new AppException('ORDER_INVALID_STATUS_TRANSITION', {
        message: 'İş başladıktan sonra sipariş iptal edilemez.',
        context: { status: row.status },
      });
    }

    this.assertTransition(row.status, OrderStatus.CANCELLED);

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      // Ödeme alınmışsa bloke hakediş serbest bırakılır; iade akışı ödeme
      // sağlayıcısı bağlandığında eklenecektir.
      if (row.status === OrderStatus.PAID) {
        await this.releaseHold(tx, row);
      }

      const order = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: now,
          cancellationReason: dto.reason ?? null,
        },
        include: orderInclude,
      });

      await this.syncJobStatus(
        tx,
        row,
        OrderStatus.CANCELLED,
        user.id,
        dto.reason ?? 'Sipariş iptal edildi',
      );

      return order;
    });

    return this.present(updated, true);
  }

  private present(row: OrderRow, revealAddress: boolean): Order {
    return toOrder(row, { revealAddress, fileBaseUrl: this.fileBaseUrl });
  }

  private get fileBaseUrl(): string {
    return this.config.fileBaseUrl;
  }

  private isStaff(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
  }

  private assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (canTransitionOrderStatus(from, to)) return;

    throw new AppException('ORDER_INVALID_STATUS_TRANSITION', {
      message: `Sipariş "${from}" durumundayken bu işlem yapılamaz.`,
      context: { from, to },
    });
  }

  /** Rol bazlı liste süzgeci. */
  private async scopeFor(user: AuthenticatedUser): Promise<Prisma.OrderWhereInput> {
    if (this.isStaff(user.role)) return {};

    if (user.role === UserRole.PROVIDER) {
      const profile = await this.requireProviderProfile(user.id);
      return { providerProfileId: profile.id };
    }

    return { customerId: user.id };
  }

  private async requireProviderProfile(userId: string): Promise<{ id: string }> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      throw new AppException('PROVIDER_PROFILE_INCOMPLETE', {
        message: 'Bu işlem için usta profiliniz olmalıdır.',
      });
    }

    return profile;
  }

  private async findOrder(id: string): Promise<OrderRow> {
    const row = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: orderInclude,
    });

    if (!row) throw AppException.notFound('Sipariş', id);
    return row;
  }

  /** Siparişi görmeye yetkili taraflar: müşteri, üstlenen usta ve personel. */
  private async requireVisibleOrder(
    user: AuthenticatedUser,
    id: string,
    options: { staffAllowed?: boolean } = {},
  ): Promise<OrderRow> {
    const row = await this.findOrder(id);

    if (options.staffAllowed !== false && this.isStaff(user.role)) return row;
    if (row.customerId === user.id) return row;
    if (row.providerProfile.userId === user.id) return row;

    throw AppException.forbiddenResource('Sipariş', { orderId: id });
  }

  private async requireOwnOrderAsCustomer(user: AuthenticatedUser, id: string): Promise<OrderRow> {
    const row = await this.findOrder(id);

    if (row.customerId !== user.id) {
      throw AppException.forbiddenResource('Sipariş', { orderId: id });
    }

    return row;
  }

  private async requireOwnOrderAsProvider(user: AuthenticatedUser, id: string): Promise<OrderRow> {
    const row = await this.findOrder(id);

    if (row.providerProfile.userId !== user.id) {
      throw AppException.forbiddenResource('Sipariş', { orderId: id });
    }

    return row;
  }

  /**
   * İşin durumunu siparişle aynı hizaya çeker.
   *
   * Geçiş tablosu izin vermiyorsa iş durumu olduğu gibi bırakılır; sipariş
   * akışı bir veri tutarsızlığı yüzünden kilitlenmemelidir.
   */
  private async syncJobStatus(
    tx: Prisma.TransactionClient,
    row: OrderRow,
    orderStatus: OrderStatus,
    userId: string,
    note: string,
  ): Promise<void> {
    const target = JOB_STATUS_FOR_ORDER[orderStatus];
    if (!target) return;

    const from = row.jobRequest.status;
    if (from === target) return;
    if (!canTransitionJobStatus(from, target)) return;

    await tx.jobRequest.update({ where: { id: row.jobRequestId }, data: { status: target } });

    await tx.jobStatusHistory.create({
      data: {
        jobRequestId: row.jobRequestId,
        fromStatus: from,
        toStatus: target,
        changedByUserId: userId,
        note,
      },
    });
  }

  /** Ödeme alındığında hakediş cüzdanda bloke edilir. */
  private async holdPayout(tx: Prisma.TransactionClient, row: OrderRow): Promise<void> {
    await tx.providerWallet.upsert({
      where: { providerProfileId: row.providerProfileId },
      create: {
        providerProfileId: row.providerProfileId,
        currency: row.currency,
        pendingMinor: row.payoutMinor,
      },
      update: { pendingMinor: { increment: row.payoutMinor } },
    });
  }

  /** Onayla birlikte bloke tutar kullanılabilir bakiyeye geçer. */
  private async releasePayout(tx: Prisma.TransactionClient, row: OrderRow): Promise<void> {
    if (row.status !== OrderStatus.AWAITING_APPROVAL) return;

    const wallet = await tx.providerWallet.update({
      where: { providerProfileId: row.providerProfileId },
      data: {
        pendingMinor: { decrement: row.payoutMinor },
        balanceMinor: { increment: row.payoutMinor },
      },
    });

    await tx.transaction.create({
      data: {
        orderId: row.id,
        walletId: wallet.id,
        type: TransactionType.PAYOUT,
        amountMinor: row.payoutMinor,
        currency: row.currency,
        balanceAfterMinor: wallet.balanceMinor,
        description: 'Hakediş serbest bırakıldı',
      },
    });

    await tx.transaction.create({
      data: {
        orderId: row.id,
        type: TransactionType.COMMISSION,
        amountMinor: -row.commissionMinor,
        currency: row.currency,
        description: 'Platform komisyonu',
      },
    });
  }

  /** İptalde bloke hakediş geri alınır. */
  private async releaseHold(tx: Prisma.TransactionClient, row: OrderRow): Promise<void> {
    await tx.providerWallet.updateMany({
      where: { providerProfileId: row.providerProfileId },
      data: { pendingMinor: { decrement: row.payoutMinor } },
    });
  }
}
