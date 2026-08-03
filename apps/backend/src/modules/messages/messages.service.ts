import { Injectable } from '@nestjs/common';
import { detectContactSharing } from '@ustapilot/business-logic';
import {
  ConversationStatus,
  OrderStatus,
  UserRole,
  type Conversation,
  type Message,
} from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';

import type {
  ListConversationsQueryDto,
  ListMessagesQueryDto,
  SendMessageDto,
} from './dto/message.dto';
import {
  conversationInclude,
  messageInclude,
  toConversation,
  toMessage,
  type ConversationRow,
  type MessageRow,
} from './message.mapper';

/** Sohbetin kapandığı sipariş durumları; kapanmış işte yeni mesaj yazılmaz. */
const CLOSED_ORDER_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
  ) {}

  /**
   * Siparişin sohbetini açar; yoksa oluşturur.
   *
   * Sohbet teklif kabulünde kendiliğinden açılmaz: taraflar yazışmaya
   * başlamadan boş sohbet üretmek listeyi kirletir. İlk açılışta kurulur ve
   * sonraki çağrılarda aynı kayıt döner.
   */
  async openForOrder(user: AuthenticatedUser, orderId: string): Promise<Conversation> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        jobRequestId: true,
        customerId: true,
        providerProfile: { select: { userId: true } },
      },
    });

    if (!order) throw AppException.notFound('Sipariş', orderId);

    const participantIds = [order.customerId, order.providerProfile.userId];
    if (!participantIds.includes(user.id)) {
      throw AppException.forbiddenResource('Sipariş', { orderId });
    }

    const existing = await this.prisma.conversation.findFirst({
      where: { orderId, deletedAt: null },
      include: conversationInclude,
    });

    if (existing) return this.presentConversation(existing, user.id);

    const created = await this.prisma.conversation.create({
      data: {
        orderId,
        jobRequestId: order.jobRequestId,
        status: ConversationStatus.ACTIVE,
        participants: { create: participantIds.map((userId) => ({ userId })) },
      },
      include: conversationInclude,
    });

    return this.presentConversation(created, user.id);
  }

  async listConversations(
    user: AuthenticatedUser,
    query: ListConversationsQueryDto,
  ): Promise<PaginatedResult<Conversation>> {
    const where: Prisma.ConversationWhereInput = {
      deletedAt: null,
      participants: { some: { userId: user.id } },
    };

    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: conversationInclude,
        // Yazışma sırası son mesaja göredir; hiç mesajı olmayan sohbet en sona düşmesin
        // diye oluşturulma tarihi ikinci ölçüt olur.
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const unreadCounts = await this.unreadCountsFor(rows, user.id);

    return PaginatedResult.of(
      rows.map((row) =>
        toConversation(row, {
          unreadCount: unreadCounts.get(row.id) ?? 0,
          fileBaseUrl: this.config.fileBaseUrl,
        }),
      ),
      total,
      query.page,
      query.limit,
    );
  }

  async getConversation(user: AuthenticatedUser, id: string): Promise<Conversation> {
    const row = await this.requireParticipation(user, id);
    return this.presentConversation(row, user.id);
  }

  /**
   * Sohbetin mesajları. En yeniden eskiye sayfalanır; istemci listeyi ters
   * çevirerek gösterir, böylece ilk sayfa her zaman en güncel yazışmadır.
   */
  async listMessages(
    user: AuthenticatedUser,
    conversationId: string,
    query: ListMessagesQueryDto,
  ): Promise<PaginatedResult<Message>> {
    await this.requireParticipation(user, conversationId);

    const where: Prisma.MessageWhereInput = { conversationId, deletedAt: null };

    const [rows, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: messageInclude,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.message.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => this.presentMessage(row)),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Mesaj gönderir.
   *
   * `clientMessageId` ile aynı mesaj iki kez yazılmaz; ağ tekrarında ilk kayıt
   * döner. Gövde, iletişim bilgisi paylaşımı açısından taranır ve şüpheli
   * mesajlar denetime düşecek şekilde işaretlenir.
   */
  async send(
    user: AuthenticatedUser,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const conversation = await this.requireParticipation(user, conversationId);
    await this.assertWritable(conversation);

    const hasContent =
      dto.body !== undefined || dto.attachmentFileIds.length > 0 || dto.location !== undefined;

    if (!hasContent) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Boş mesaj gönderilemez.',
        details: [{ field: 'body', issue: 'Mesaj metni, dosya veya konum gerekir' }],
      });
    }

    // Kimlik tahmin eden birinin yabancı dosyayı sohbete iliştirmesi engellenir.
    await this.files.assertOwnedBy(user.id, dto.attachmentFileIds);

    const duplicate = await this.prisma.message.findFirst({
      where: { conversationId, clientMessageId: dto.clientMessageId },
      include: messageInclude,
    });

    if (duplicate) return this.presentMessage(duplicate);

    const { isFlagged } = detectContactSharing(dto.body);
    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: user.id,
          type: dto.type,
          body: dto.body ?? null,
          latitude: dto.location?.latitude ?? null,
          longitude: dto.location?.longitude ?? null,
          clientMessageId: dto.clientMessageId,
          isFlagged,
          ...(dto.attachmentFileIds.length > 0
            ? { attachments: { create: dto.attachmentFileIds.map((fileId) => ({ fileId })) } }
            : {}),
        },
        include: messageInclude,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      });

      // Gönderen kendi mesajını okumuş sayılır; aksi halde kendi yazdığı mesaj
      // okunmamış olarak görünürdü.
      await tx.conversationParticipant.updateMany({
        where: { conversationId, userId: user.id },
        data: { lastReadAt: now },
      });

      return message;
    });

    return this.presentMessage(created);
  }

  /** Sohbeti okundu işaretler. */
  async markRead(user: AuthenticatedUser, conversationId: string): Promise<Conversation> {
    await this.requireParticipation(user, conversationId);

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    });

    const row = await this.prisma.conversation.findFirstOrThrow({
      where: { id: conversationId },
      include: conversationInclude,
    });

    return this.presentConversation(row, user.id);
  }

  private async presentConversation(row: ConversationRow, userId: string): Promise<Conversation> {
    const lastReadAt = row.participants.find((item) => item.userId === userId)?.lastReadAt;

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: row.id,
        deletedAt: null,
        senderId: { not: userId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });

    return toConversation(row, { unreadCount, fileBaseUrl: this.config.fileBaseUrl });
  }

  private presentMessage(row: MessageRow): Message {
    return toMessage(row, { fileBaseUrl: this.config.fileBaseUrl });
  }

  /**
   * Sohbet başına okunmamış mesaj sayısı.
   *
   * Her sohbet için ayrı sorgu atmak liste uzadıkça N+1'e döner; tek gruplu
   * sayım yeterlidir.
   */
  private async unreadCountsFor(
    rows: ConversationRow[],
    userId: string,
  ): Promise<Map<string, number>> {
    if (rows.length === 0) return new Map();

    const conditions = rows.map((row) => {
      const lastReadAt = row.participants.find((item) => item.userId === userId)?.lastReadAt;

      return {
        conversationId: row.id,
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      };
    });

    const grouped = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        deletedAt: null,
        senderId: { not: userId },
        OR: conditions,
      },
      _count: { _all: true },
    });

    return new Map(grouped.map((item) => [item.conversationId, item._count._all]));
  }

  private async requireParticipation(
    user: AuthenticatedUser,
    conversationId: string,
  ): Promise<ConversationRow> {
    const row = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      include: conversationInclude,
    });

    if (!row) throw AppException.notFound('Sohbet', conversationId);

    const isParticipant = row.participants.some((item) => item.userId === user.id);
    if (isParticipant) return row;

    // Destek ekibi anlaşmazlık incelemesinde yazışmayı okuyabilir; yazamaz.
    if (this.isStaff(user.role)) return row;

    throw AppException.forbiddenResource('Sohbet', { conversationId });
  }

  /** Kapanmış sipariş ya da arşivlenmiş sohbette yeni mesaj yazılmaz. */
  private async assertWritable(row: ConversationRow): Promise<void> {
    if (row.status !== ConversationStatus.ACTIVE) {
      throw new AppException('CONFLICT', {
        message: 'Bu sohbet kapalı; yeni mesaj gönderilemez.',
        context: { status: row.status },
      });
    }

    if (!row.orderId) return;

    const order = await this.prisma.order.findUnique({
      where: { id: row.orderId },
      select: { status: true },
    });

    if (order && CLOSED_ORDER_STATUSES.includes(order.status)) {
      throw new AppException('CONFLICT', {
        message: 'İş kapandığı için sohbete yeni mesaj yazılamaz.',
        context: { orderStatus: order.status },
      });
    }
  }

  private isStaff(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
  }
}
