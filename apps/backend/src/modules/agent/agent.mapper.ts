import type {
  AgentActionProposal,
  AgentChatResponse,
  AgentMessage,
  AgentThread,
} from '@talpio/types';

import type {
  AgentActionProposal as PrismaAction,
  AgentMessage as PrismaMessage,
  AgentThread as PrismaThread,
} from '@/generated/prisma/client';

export function toAgentThread(row: PrismaThread): AgentThread {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAgentMessage(row: PrismaMessage): AgentMessage {
  return {
    id: row.id,
    threadId: row.threadId,
    role: row.role,
    content: row.content,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAgentAction(row: PrismaAction): AgentActionProposal {
  return {
    id: row.id,
    threadId: row.threadId,
    tenantId: row.tenantId,
    userId: row.userId,
    toolName: row.toolName as AgentActionProposal['toolName'],
    summary: row.summary,
    input: (row.input as Record<string, unknown>) ?? {},
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
  };
}

export function toAgentChatResponse(
  thread: PrismaThread,
  messages: PrismaMessage[],
  pendingActions: PrismaAction[],
): AgentChatResponse {
  return {
    thread: toAgentThread(thread),
    messages: messages.map(toAgentMessage),
    pendingActions: pendingActions.map(toAgentAction),
  };
}
