import { Injectable } from '@nestjs/common';
import { deepLinks } from '@talpio/config';
import {
  ComplaintStatus,
  NotificationType,
  SupportTicketStatus,
  UserRole,
  type AdminComplaintSummary,
  type AdminSupportTicketDetail,
  type AdminSupportTicketSummary,
  type Complaint,
  type SupportMessage,
  type SupportTicket,
  type SupportTicketDetail,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type {
  CreateComplaintDto,
  CreateSupportTicketDto,
  ListComplaintsQueryDto,
  ListSupportTicketsQueryDto,
  SupportTicketReplyDto,
  UpdateComplaintDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';
import {
  adminComplaintInclude,
  adminSupportTicketDetailInclude,
  adminSupportTicketInclude,
  supportTicketInclude,
  toAdminComplaint,
  toAdminSupportTicket,
  toAdminSupportTicketDetail,
  toComplaint,
  toSupportMessage,
  toSupportTicket,
  toSupportTicketDetail,
  type AdminComplaintRow,
  type AdminSupportTicketRow,
  type SupportTicketRow,
} from './support.mapper';

const TICKET_SORT = ['createdAt', 'lastMessageAt', 'updatedAt'] as const;
const COMPLAINT_SORT = ['createdAt', 'updatedAt', 'resolvedAt'] as const;

/** Kapatılmış veya çözülmüş bilette yeni mesaj yazılmaz. */
const TERMINAL_TICKET_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.RESOLVED,
  SupportTicketStatus.CLOSED,
];

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Kullanıcı destek bileti açar; ilk mesaj gövdeyle birlikte yazılır.
   *
   * `orderId` verilirse siparişin tarafı olduğu doğrulanır; aksi halde kimlik
   * tahmin eden biri yabancı bir siparişe bağlanmış bilet açabilirdi.
   */
  async createTicket(
    user: AuthenticatedUser,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicketDetail> {
    await this.files.assertOwnedBy(user.id, dto.attachmentFileIds);

    if (dto.orderId) {
      await this.assertOrderParticipant(user.id, dto.orderId);
    }

    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: user.id,
          subject: dto.subject,
          status: SupportTicketStatus.OPEN,
          orderId: dto.orderId ?? null,
          lastMessageAt: now,
          messages: {
            create: {
              senderId: user.id,
              body: dto.body,
              isFromStaff: false,
              attachmentIds: dto.attachmentFileIds,
            },
          },
        },
        include: supportTicketInclude,
      });

      return ticket;
    });

    return toSupportTicketDetail(created);
  }

  async listMine(
    user: AuthenticatedUser,
    query: ListSupportTicketsQueryDto,
  ): Promise<PaginatedResult<SupportTicket>> {
    const where: Prisma.SupportTicketWhereInput = {
      deletedAt: null,
      userId: user.id,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.q ? { subject: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: query.toOrderBy(TICKET_SORT, { lastMessageAt: 'desc' }),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toSupportTicket), total, query.page, query.limit);
  }

  async getById(user: AuthenticatedUser, id: string): Promise<SupportTicketDetail> {
    const row = await this.requireAccessibleTicket(user, id);
    return toSupportTicketDetail(row);
  }

  /**
   * Bilete mesaj ekler.
   *
   * Personel yazınca durum `WAITING_CUSTOMER` olur ve sahibine `SUPPORT_REPLY`
   * bildirimi gider. Kullanıcı yazınca durum `WAITING_SUPPORT` olur. Bildirim
   * transaction dışında; gönderim hatası ana akışı bozmaz.
   */
  async addMessage(
    user: AuthenticatedUser,
    ticketId: string,
    dto: SupportTicketReplyDto,
  ): Promise<SupportMessage> {
    const ticket = await this.requireAccessibleTicket(user, ticketId);

    if (TERMINAL_TICKET_STATUSES.includes(ticket.status)) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Kapatılmış veya çözülmüş bilete mesaj yazılamaz.',
        context: { ticketId, status: ticket.status },
      });
    }

    await this.files.assertOwnedBy(user.id, dto.attachmentFileIds);

    const isStaff = this.isStaff(user.role);
    // Personel olmayan biri yalnızca kendi bileti için buraya gelebilir; personel
    // bayrağı rol üzerinden set edilir, istemciden alınmaz.
    const now = new Date();
    const nextStatus = isStaff
      ? SupportTicketStatus.WAITING_CUSTOMER
      : SupportTicketStatus.WAITING_SUPPORT;

    const created = await this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: {
          ticketId,
          senderId: user.id,
          body: dto.body,
          isFromStaff: isStaff,
          attachmentIds: dto.attachmentFileIds,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { lastMessageAt: now, status: nextStatus },
      });

      return message;
    });

    if (isStaff && ticket.userId !== user.id) {
      await this.notifications.dispatch({
        userId: ticket.userId,
        type: NotificationType.SUPPORT_REPLY,
        params: { ticketSubject: ticket.subject },
        deepLink: deepLinks.supportTicket(ticketId),
      });
    }

    return toSupportMessage(created);
  }

  async closeTicket(user: AuthenticatedUser, ticketId: string): Promise<SupportTicket> {
    const ticket = await this.requireAccessibleTicket(user, ticketId);

    if (ticket.status === SupportTicketStatus.CLOSED) {
      return toSupportTicket(ticket);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: SupportTicketStatus.CLOSED },
    });

    return toSupportTicket(updated);
  }

  async createComplaint(user: AuthenticatedUser, dto: CreateComplaintDto): Promise<Complaint> {
    const created = await this.prisma.complaint.create({
      data: {
        reporterId: user.id,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        reason: dto.reason,
        description: dto.description ?? null,
        status: ComplaintStatus.OPEN,
      },
    });

    return toComplaint(created);
  }

  async listMyComplaints(
    user: AuthenticatedUser,
    query: ListComplaintsQueryDto,
  ): Promise<PaginatedResult<Complaint>> {
    const where: Prisma.ComplaintWhereInput = {
      deletedAt: null,
      reporterId: user.id,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: query.toOrderBy(COMPLAINT_SORT),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return PaginatedResult.of(rows.map(toComplaint), total, query.page, query.limit);
  }

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  async listAllTickets(
    query: ListSupportTicketsQueryDto,
  ): Promise<PaginatedResult<AdminSupportTicketSummary>> {
    const where: Prisma.SupportTicketWhereInput = {
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.q
        ? {
            OR: [
              { subject: { contains: query.q, mode: 'insensitive' as const } },
              { user: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
              { user: { email: { contains: query.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: adminSupportTicketInclude,
        orderBy: query.toOrderBy(TICKET_SORT, { lastMessageAt: 'desc' }),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return PaginatedResult.of(
      (rows as AdminSupportTicketRow[]).map(toAdminSupportTicket),
      total,
      query.page,
      query.limit,
    );
  }

  async getTicketForStaff(id: string): Promise<AdminSupportTicketDetail> {
    const row = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      include: adminSupportTicketDetailInclude,
    });

    if (!row) throw AppException.notFound('Destek talebi', id);
    return toAdminSupportTicketDetail(row);
  }

  async updateTicket(id: string, dto: UpdateSupportTicketDto): Promise<AdminSupportTicketDetail> {
    const current = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!current) throw AppException.notFound('Destek talebi', id);

    if (dto.assignedToUserId) {
      await this.assertStaffAssignee(dto.assignedToUserId);
    }

    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedToUserId !== undefined ? { assignedToUserId: dto.assignedToUserId } : {}),
      },
    });

    return this.getTicketForStaff(id);
  }

  async listAllComplaints(
    query: ListComplaintsQueryDto,
  ): Promise<PaginatedResult<AdminComplaintSummary>> {
    const where: Prisma.ComplaintWhereInput = {
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.q
        ? {
            OR: [
              { reason: { contains: query.q, mode: 'insensitive' as const } },
              { reporter: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
              { reporter: { email: { contains: query.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: adminComplaintInclude,
        orderBy: query.toOrderBy(COMPLAINT_SORT),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return PaginatedResult.of(
      (rows as AdminComplaintRow[]).map(toAdminComplaint),
      total,
      query.page,
      query.limit,
    );
  }

  async updateComplaint(id: string, dto: UpdateComplaintDto): Promise<AdminComplaintSummary> {
    const current = await this.prisma.complaint.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!current) throw AppException.notFound('Şikâyet', id);

    const nextStatus = dto.status ?? current.status;
    const isTerminal =
      nextStatus === ComplaintStatus.RESOLVED || nextStatus === ComplaintStatus.REJECTED;

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.resolutionNote !== undefined ? { resolutionNote: dto.resolutionNote } : {}),
        ...(isTerminal ? { resolvedAt: new Date() } : {}),
      },
      include: adminComplaintInclude,
    });

    return toAdminComplaint(updated);
  }

  // -------------------------------------------------------------------------
  // Yardımcılar
  // -------------------------------------------------------------------------

  private isStaff(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
  }

  private async requireAccessibleTicket(
    user: AuthenticatedUser,
    id: string,
  ): Promise<SupportTicketRow> {
    const row = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      include: supportTicketInclude,
    });

    if (!row) throw AppException.notFound('Destek talebi', id);

    if (!this.isStaff(user.role) && row.userId !== user.id) {
      throw AppException.forbiddenResource('Destek talebi', { ticketId: id });
    }

    return row;
  }

  private async assertOrderParticipant(userId: string, orderId: string): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        customerId: true,
        providerProfile: { select: { userId: true } },
      },
    });

    if (!order) throw AppException.notFound('Sipariş', orderId);

    const participantIds = [order.customerId, order.providerProfile.userId];
    if (!participantIds.includes(userId)) {
      throw AppException.forbiddenResource('Sipariş', { orderId });
    }
  }

  private async assertStaffAssignee(userId: string): Promise<void> {
    const assignee = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT] },
      },
      select: { id: true },
    });

    if (!assignee) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Atanan kullanıcı destek personeli olmalıdır.',
        details: [{ field: 'assignedToUserId', issue: 'Geçersiz personel' }],
      });
    }
  }
}
