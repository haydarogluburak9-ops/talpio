import type { Prisma } from '@/generated/prisma/client';
import type {
  AdminComplaintSummary,
  AdminSupportTicketDetail,
  AdminSupportTicketSummary,
  Complaint,
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
} from '@talpio/types';

export const supportTicketInclude = {
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.SupportTicketInclude;

export type SupportTicketRow = Prisma.SupportTicketGetPayload<{
  include: typeof supportTicketInclude;
}>;

export type SupportMessageRow = Prisma.SupportMessageGetPayload<object>;

export const adminSupportTicketInclude = {
  user: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true } },
  _count: { select: { messages: { where: { deletedAt: null } } } },
} satisfies Prisma.SupportTicketInclude;

export type AdminSupportTicketRow = Prisma.SupportTicketGetPayload<{
  include: typeof adminSupportTicketInclude;
}>;

export const adminSupportTicketDetailInclude = {
  ...adminSupportTicketInclude,
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.SupportTicketInclude;

export type AdminSupportTicketDetailRow = Prisma.SupportTicketGetPayload<{
  include: typeof adminSupportTicketDetailInclude;
}>;

export const adminComplaintInclude = {
  reporter: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.ComplaintInclude;

export type AdminComplaintRow = Prisma.ComplaintGetPayload<{
  include: typeof adminComplaintInclude;
}>;

export function toSupportTicket(row: Prisma.SupportTicketGetPayload<object>): SupportTicket {
  return {
    id: row.id,
    userId: row.userId,
    subject: row.subject,
    status: row.status,
    assignedToUserId: row.assignedToUserId,
    orderId: row.orderId,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSupportMessage(row: SupportMessageRow): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticketId,
    senderId: row.senderId,
    body: row.body,
    isFromStaff: row.isFromStaff,
    attachmentIds: row.attachmentIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.createdAt.toISOString(),
  };
}

export function toSupportTicketDetail(row: SupportTicketRow): SupportTicketDetail {
  return {
    ...toSupportTicket(row),
    messages: row.messages.map(toSupportMessage),
  };
}

export function toComplaint(row: Prisma.ComplaintGetPayload<object>): Complaint {
  return {
    id: row.id,
    reporterId: row.reporterId,
    status: row.status,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    reason: row.reason,
    description: row.description,
    resolutionNote: row.resolutionNote,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminSupportTicket(row: AdminSupportTicketRow): AdminSupportTicketSummary {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user.fullName,
    userEmail: row.user.email,
    subject: row.subject,
    status: row.status,
    assignedToUserId: row.assignedToUserId,
    assignedToName: row.assignedTo?.fullName ?? null,
    orderId: row.orderId,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    messageCount: row._count.messages,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminSupportTicketDetail(
  row: AdminSupportTicketDetailRow,
): AdminSupportTicketDetail {
  return {
    ...toAdminSupportTicket(row),
    messages: row.messages.map(toSupportMessage),
  };
}

export function toAdminComplaint(row: AdminComplaintRow): AdminComplaintSummary {
  return {
    id: row.id,
    reporterId: row.reporterId,
    reporterName: row.reporter.fullName,
    reporterEmail: row.reporter.email,
    status: row.status,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    reason: row.reason,
    description: row.description,
    resolutionNote: row.resolutionNote,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
