import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import {
  DOMAIN_EVENT_TYPES,
  NotificationType,
  QUEUE_NAMES,
  type DomainEventEnvelope,
  type OrderCreatedEventPayload,
  type RequestMatchedEventPayload,
  type WorkOrderBridgeRequestedPayload,
} from '@talpio/types';
import { deepLinks } from '@talpio/config';

import type { Prisma } from '@/generated/prisma/client';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { QueueService } from '@infra/queue/queue.service';

/**
 * PENDING outbox satırlarını periyodik yayınlar.
 *
 * Karar: Outbox publisher API sürecinde kalır (basitlik); uzun AI tool
 * döngüleri worker sürecinde (`ai-agent` kuyruğu) işlenir.
 */
@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly queues: QueueService,
  ) {}

  onModuleInit(): void {
    const interval = this.config.outboxPollMs;
    this.timer = setInterval(() => {
      void this.poll();
    }, interval);
    this.logger.log(`Outbox publisher API sürecinde başlatıldı (poll=${interval}ms)`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const pending = await this.prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      for (const row of pending) {
        await this.publishOne(row.id);
      }
    } catch (error) {
      this.logger.error({ err: error }, 'Outbox poll hatası');
    } finally {
      this.running = false;
    }
  }

  /**
   * Tek satırı atomik olarak PENDING → PUBLISHED yapar.
   * Status kontrolü tüketici idempotency'sidir: publishedAt set edilmişse atlanır.
   */
  async publishOne(id: string): Promise<void> {
    const claimed = await this.prisma.outboxEvent.updateMany({
      where: { id, status: 'PENDING' },
      data: { attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return;

    const row = await this.prisma.outboxEvent.findUnique({ where: { id } });
    if (!row || row.status !== 'PENDING' || row.publishedAt) return;

    try {
      await this.dispatch({
        type: row.type as DomainEventEnvelope['type'],
        idempotencyKey: row.idempotencyKey,
        tenantId: row.tenantId,
        aggregateType: row.aggregateType,
        aggregateId: row.aggregateId,
        payload: row.payload as Record<string, unknown>,
        occurredAt: row.createdAt.toISOString(),
      });

      await this.prisma.outboxEvent.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'PUBLISHED', publishedAt: new Date(), lastError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.outboxEvent.update({
        where: { id },
        data: {
          status: row.attempts + 1 >= 10 ? 'FAILED' : 'PENDING',
          lastError: message.slice(0, 500),
        },
      });
      this.logger.warn({ id, err: message }, 'Outbox yayınlanamadı');
    }
  }

  private async dispatch(event: DomainEventEnvelope): Promise<void> {
    if (event.type === DOMAIN_EVENT_TYPES.ORDER_CREATED) {
      await this.handleOrderCreated(
        event as unknown as DomainEventEnvelope<OrderCreatedEventPayload>,
      );
      return;
    }

    if (event.type === DOMAIN_EVENT_TYPES.WORK_ORDER_BRIDGE_REQUESTED) {
      await this.handleWorkOrderBridge(
        event as unknown as DomainEventEnvelope<WorkOrderBridgeRequestedPayload>,
      );
      return;
    }

    if (event.type === DOMAIN_EVENT_TYPES.REQUEST_MATCHED) {
      await this.handleRequestMatched(
        event as unknown as DomainEventEnvelope<RequestMatchedEventPayload>,
      );
      return;
    }

    // Bilinmeyen olaylar kaybolmasın diye notification kuyruğuna düşülür.
    await this.queues.enqueue(QUEUE_NAMES.NOTIFICATION, {
      idempotencyKey: `outbox:${event.idempotencyKey}`,
      tenantId: event.tenantId,
      payload: { notificationId: event.aggregateId },
      enqueuedAt: new Date().toISOString(),
    });
  }

  /**
   * Order oluşunca köprü linki PENDING upsert + bridge_requested outbox.
   * Link `marketplaceOrderId` unique ile idempotenttir.
   */
  private async handleOrderCreated(
    event: DomainEventEnvelope<OrderCreatedEventPayload>,
  ): Promise<void> {
    const payload = event.payload;
    await this.prisma.marketplaceWorkOrderLink.upsert({
      where: { marketplaceOrderId: payload.orderId },
      create: {
        tenantId: payload.providerProfileId,
        marketplaceOrderId: payload.orderId,
        bridgeStatus: 'PENDING',
      },
      update: {},
    });

    const bridgeKey = `work_order.bridge_requested:${payload.orderId}`;
    const bridgePayload: WorkOrderBridgeRequestedPayload = {
      orderId: payload.orderId,
      providerProfileId: payload.providerProfileId,
      customerId: payload.customerId,
      source: 'TALPIO',
    };

    try {
      await this.prisma.outboxEvent.create({
        data: {
          type: DOMAIN_EVENT_TYPES.WORK_ORDER_BRIDGE_REQUESTED,
          idempotencyKey: bridgeKey,
          tenantId: payload.providerProfileId,
          aggregateType: 'Order',
          aggregateId: payload.orderId,
          payload: bridgePayload as unknown as Prisma.InputJsonValue,
          status: 'PENDING',
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  /**
   * PENDING köprüyü WorkOrder + CrmCustomer ile LINKED yapar (idempotent).
   */
  private async handleWorkOrderBridge(
    event: DomainEventEnvelope<WorkOrderBridgeRequestedPayload>,
  ): Promise<void> {
    const payload = event.payload;
    const link = await this.prisma.marketplaceWorkOrderLink.findUnique({
      where: { marketplaceOrderId: payload.orderId },
    });
    if (!link) return;
    if (link.workOrderId && link.bridgeStatus === 'LINKED') return;

    const order = await this.prisma.order.findUnique({
      where: { id: payload.orderId },
      select: {
        id: true,
        customerId: true,
        providerProfileId: true,
        currency: true,
        jobRequest: { select: { title: true } },
      },
    });
    if (!order) return;

    const business = await this.prisma.business.findFirst({
      where: { providerProfileId: order.providerProfileId, deletedAt: null },
      select: { id: true },
    });
    if (!business) {
      this.logger.warn(
        `WorkOrder köprüsü atlandı: sipariş ${order.id} için işletme yok (providerProfileId=${order.providerProfileId}).`,
      );
      return;
    }
    const tenantId = business.id;

    const customerUser = await this.prisma.user.findUnique({
      where: { id: order.customerId },
      select: { id: true, fullName: true, email: true, phone: true },
    });

    await this.prisma.$transaction(async (tx) => {
      let crm = customerUser
        ? await tx.crmCustomer.findFirst({
            where: {
              tenantId,
              userId: customerUser.id,
              deletedAt: null,
            },
          })
        : null;

      if (!crm) {
        crm = await tx.crmCustomer.create({
          data: {
            tenantId,
            userId: customerUser?.id ?? null,
            displayName: customerUser?.fullName ?? 'Müşteri',
            email: customerUser?.email ?? null,
            phone: customerUser?.phone ?? null,
            source: 'TALPIO',
          },
        });
      }

      const existingWo = await tx.workOrder.findFirst({
        where: { marketplaceOrderId: order.id, deletedAt: null },
      });

      const workOrder =
        existingWo ??
        (await tx.workOrder.create({
          data: {
            tenantId,
            customerId: crm.id,
            source: 'TALPIO',
            stage: 'NEW',
            title: order.jobRequest?.title ?? `Sipariş ${order.id.slice(0, 8)}`,
            marketplaceOrderId: order.id,
            currency: order.currency,
          },
        }));

      await tx.marketplaceWorkOrderLink.update({
        where: { id: link.id },
        data: { workOrderId: workOrder.id, bridgeStatus: 'LINKED' },
      });
    });
  }

  private async handleRequestMatched(
    event: DomainEventEnvelope<RequestMatchedEventPayload>,
  ): Promise<void> {
    const payload = event.payload;
    await this.queues.enqueue(QUEUE_NAMES.NOTIFICATION, {
      idempotencyKey: event.idempotencyKey,
      tenantId: event.tenantId,
      payload: {
        userId: payload.userId,
        type: NotificationType.REQUEST_MATCHED,
        params: {
          requestId: payload.requestId,
          requestTitle: payload.requestTitle,
          categoryName: payload.categoryName,
          cityName: payload.cityName,
          shortDescription: payload.shortDescription,
          deadline: payload.deadline,
          matchScore: payload.matchScore,
        },
        deepLink: deepLinks.commerceRequest(payload.requestId),
        dedupeKey: event.idempotencyKey,
        requestId: payload.requestId,
        businessId: payload.businessId,
      },
      enqueuedAt: new Date().toISOString(),
    });
  }
}
