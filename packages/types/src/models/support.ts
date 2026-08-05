import type { ComplaintStatus, SupportTicketStatus } from '../enums/statuses';
import type { BaseEntity } from './common';

export interface SupportTicket extends BaseEntity {
  userId: string;
  subject: string;
  status: SupportTicketStatus;
  assignedToUserId?: string | null;
  orderId?: string | null;
  lastMessageAt?: string | null;
}

/** Detay ucu bilet gövdesini mesajlarıyla birlikte döner. */
export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export interface SupportMessage extends BaseEntity {
  ticketId: string;
  senderId: string;
  body: string;
  isFromStaff: boolean;
  attachmentIds: string[];
}

export interface Complaint extends BaseEntity {
  reporterId: string;
  status: ComplaintStatus;
  /** Şikâyet edilen kayıt: kullanıcı, iş, teklif veya yorum. */
  subjectType: 'USER' | 'JOB_REQUEST' | 'OFFER' | 'REVIEW' | 'MESSAGE';
  subjectId: string;
  reason: string;
  description?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
}

export interface AuditLog extends BaseEntity {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  /** Yalnızca değişen alanlar; hassas veriler maskelenir. */
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SystemSetting extends BaseEntity {
  key: string;
  value: unknown;
  description?: string | null;
  isSecret: boolean;
}
