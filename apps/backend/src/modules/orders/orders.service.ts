import { Injectable } from '@nestjs/common';
import { canTransitionOrderStatus } from '@ustapilot/business-logic';
import { OrderStatus, PaymentStatus, UserRole, type Order } from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { PaymentsService, type ChargeIntent } from '@modules/payments/payments.service';

import type { CancelOrderDto, CompleteOrderDto, PayOrderDto } from './dto/order-action.dto';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { syncJobStatus } from './job-status.sync';
import { orderInclude, toOrder, type OrderRow } from './order.mapper';

const SORTABLE_FIELDS = ['createdAt', 'scheduledAt', 'updatedAt'] as const;

/** Siparişin iptal edilebildiği durumlar. İş başladıktan sonra iptal yerine anlaşmazlık açılır. */
const CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly payments: PaymentsService,
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
   * Tahsilat etkin ödeme sağlayıcısı üzerinden yapılır; hakediş, iş onaylanana
   * kadar ustanın cüzdanında bloke tutulur.
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

    const intent: ChargeIntent = {
      orderId: id,
      amountMinor: row.totalMinor,
      currency: row.currency,
      idempotencyKey: dto.idempotencyKey ?? null,
    };

    // Sağlayıcı çağrısı işlemin dışında yapılır; dış servis beklenirken sipariş
    // satırının kilitli kalması ve hata kaydının geri alınması istenmez.
    const outcome = await this.payments.charge(intent);

    if (outcome.status !== PaymentStatus.CAPTURED) {
      await this.payments.recordFailure(intent, outcome);

      throw new AppException('PAYMENT_FAILED', {
        message: outcome.failureReason ?? 'Ödeme alınamadı.',
        context: { orderId: id },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.payments.recordCapture(tx, intent, outcome);
      await this.payments.holdPayout(tx, row);

      const order = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.PAID,
          ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        },
        include: orderInclude,
      });

      await this.syncJob(tx, row, OrderStatus.PAID, user.id, 'Ödeme alındı');

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

      await this.syncJob(tx, row, OrderStatus.IN_PROGRESS, user.id, 'Usta işe başladı');

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

      await this.syncJob(
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

      await this.payments.releasePayout(tx, row);

      await tx.providerProfile.update({
        where: { id: row.providerProfileId },
        data: { completedJobCount: { increment: 1 } },
      });

      await tx.customerProfile.updateMany({
        where: { userId: row.customerId },
        data: { completedJobCount: { increment: 1 } },
      });

      await this.syncJob(tx, row, OrderStatus.COMPLETED, user.id, 'Müşteri işi onayladı');

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

    // İade sağlayıcı çağrısı işlemin dışında kalır. Sağlayıcı parayı geri
    // vermezse iptal de yapılmaz: sipariş kapanıp paranın platformda kalması
    // sessiz bir kayıp olurdu.
    const refund =
      row.status === OrderStatus.PAID ? await this.payments.prepareRefund(id, dto.reason) : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (row.status === OrderStatus.PAID) {
        if (refund) await this.payments.recordRefund(tx, refund, id);
        await this.payments.releaseHold(tx, row);
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

      await this.syncJob(
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

  private syncJob(
    tx: Prisma.TransactionClient,
    row: OrderRow,
    orderStatus: OrderStatus,
    userId: string,
    note: string,
  ): Promise<void> {
    return syncJobStatus(
      tx,
      { jobRequestId: row.jobRequestId, jobStatus: row.jobRequest.status },
      orderStatus,
      userId,
      note,
    );
  }
}
