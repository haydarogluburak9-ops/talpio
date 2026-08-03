import type { Prisma } from '@/generated/prisma/client';
import type {
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessagePreview,
} from '@ustapilot/types';

/** Sohbet sorgularında daima çekilen ilişkiler. */
export const conversationInclude = {
  participants: {
    include: {
      user: { select: { id: true, fullName: true, avatar: { select: { storageKey: true } } } },
    },
  },
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { id: true, type: true, body: true, senderId: true, createdAt: true },
  },
} satisfies Prisma.ConversationInclude;

export type ConversationRow = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

export const messageInclude = {
  attachments: {
    include: {
      file: { select: { id: true, storageKey: true, mimeType: true, sizeBytes: true } },
    },
  },
} satisfies Prisma.MessageInclude;

export type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

/**
 * Sohbeti API gövdesine çevirir.
 *
 * Okunmamış sayısı katılımcıya göre değiştiği için sorgudan ayrı hesaplanır ve
 * dışarıdan verilir.
 */
export function toConversation(
  row: ConversationRow,
  options: { unreadCount: number; fileBaseUrl: string },
): Conversation {
  return {
    id: row.id,
    jobRequestId: row.jobRequestId,
    orderId: row.orderId,
    status: row.status,
    participants: row.participants.map((item) => toParticipant(item, options.fileBaseUrl)),
    lastMessage: row.messages[0] ? toPreview(row.messages[0]) : null,
    unreadCount: options.unreadCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toParticipant(
  row: ConversationRow['participants'][number],
  fileBaseUrl: string,
): ConversationParticipant {
  const avatarKey = row.user.avatar?.storageKey;

  return {
    userId: row.user.id,
    displayName: row.user.fullName,
    avatarUrl: avatarKey ? `${fileBaseUrl}/${avatarKey}` : null,
    lastReadAt: row.lastReadAt?.toISOString() ?? null,
  };
}

function toPreview(row: ConversationRow['messages'][number]): MessagePreview {
  return {
    id: row.id,
    type: row.type,
    body: row.body,
    // Sistem mesajlarında gönderen yoktur; istemci boş dizeyi sistem sayar.
    senderId: row.senderId ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export function toMessage(row: MessageRow, options: { fileBaseUrl: string }): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    type: row.type,
    body: row.body,
    location:
      row.latitude === null || row.longitude === null
        ? null
        : { latitude: Number(row.latitude), longitude: Number(row.longitude) },
    attachments: row.attachments.map((item) => toAttachment(item, options.fileBaseUrl)),
    isFlagged: row.isFlagged,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAttachment(
  row: MessageRow['attachments'][number],
  fileBaseUrl: string,
): MessageAttachment {
  return {
    id: row.id,
    fileId: row.fileId,
    url: `${fileBaseUrl}/${row.file.storageKey}`,
    mimeType: row.file.mimeType,
    sizeBytes: row.file.sizeBytes,
  };
}
