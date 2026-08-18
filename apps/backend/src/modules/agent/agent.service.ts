import { Injectable } from '@nestjs/common';
import {
  AGENT_TOOL_NAMES,
  AiFeatureCode,
  CampaignAudience,
  CampaignStatus,
  type AgentActionProposal,
  type AgentChatResponse,
  type AgentThread,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { AppException } from '@common/errors/app.exception';
import { AiService } from '@infra/ai/ai.service';
import { AiChatRole } from '@infra/ai/ai-provider';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { toolDefinitionsForAi } from './agent-tool.registry';
import { AgentToolsService } from './agent-tools.service';
import {
  toAgentAction,
  toAgentChatResponse,
  toAgentThread,
} from './agent.mapper';
import type { CreateAgentThreadDto, PostAgentMessageDto } from './dto/agent.dto';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly tools: AgentToolsService,
    private readonly audit: AuditLogService,
  ) {}

  async createThread(
    user: AuthenticatedUser,
    dto: CreateAgentThreadDto,
  ): Promise<AgentThread> {
    const tenantId = await this.requireTenantId(user);
    const row = await this.prisma.agentThread.create({
      data: {
        tenantId,
        userId: user.id,
        title: dto.title?.trim() || 'Asistan',
      },
    });
    return toAgentThread(row);
  }

  async listThreads(user: AuthenticatedUser): Promise<AgentThread[]> {
    const tenantId = await this.requireTenantId(user);
    const rows = await this.prisma.agentThread.findMany({
      where: { tenantId, userId: user.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return rows.map(toAgentThread);
  }

  async getThread(user: AuthenticatedUser, id: string): Promise<AgentChatResponse> {
    const tenantId = await this.requireTenantId(user);
    const thread = await this.requireThread(tenantId, user.id, id);
    const [messages, pendingActions] = await Promise.all([
      this.prisma.agentMessage.findMany({
        where: { threadId: thread.id },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.prisma.agentActionProposal.findMany({
        where: { threadId: thread.id, tenantId, status: 'PENDING_APPROVAL' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return toAgentChatResponse(thread, messages, pendingActions);
  }

  /**
   * Senkron chat: user → AI tool önerisi → allowlist execute → assistant.
   * Finans LLM'de hesaplanmaz; tool sonuçları gerçek sorgudan gelir.
   */
  async postMessage(
    user: AuthenticatedUser,
    threadId: string,
    dto: PostAgentMessageDto,
  ): Promise<AgentChatResponse> {
    const tenantId = await this.requireTenantId(user);
    const thread = await this.requireThread(tenantId, user.id, threadId);

    const userMessage = await this.prisma.agentMessage.create({
      data: {
        threadId: thread.id,
        role: 'USER',
        content: dto.content.trim(),
      },
    });

    await this.runAssistantTurn({
      tenantId,
      userId: user.id,
      threadId: thread.id,
      messageId: userMessage.id,
      userContent: dto.content.trim(),
    });

    return this.getThread(user, thread.id);
  }

  async listPendingActions(user: AuthenticatedUser): Promise<AgentActionProposal[]> {
    const tenantId = await this.requireTenantId(user);
    const rows = await this.prisma.agentActionProposal.findMany({
      where: { tenantId, userId: user.id, status: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map(toAgentAction);
  }

  async approveAction(user: AuthenticatedUser, id: string): Promise<AgentActionProposal> {
    const tenantId = await this.requireTenantId(user);
    const proposal = await this.prisma.agentActionProposal.findFirst({
      where: { id, tenantId, userId: user.id },
    });

    if (!proposal) {
      throw AppException.notFound('Aksiyon önerisi', id);
    }
    if (proposal.status !== 'PENDING_APPROVAL') {
      throw new AppException('CONFLICT', {
        message: 'Bu aksiyon zaten karara bağlanmış.',
        context: { status: proposal.status },
      });
    }

    const executed = await this.executeApprovedProposal(user, tenantId, proposal);

    await this.audit.record({
      actorId: user.id,
      action: 'agent.action.approve',
      entityType: 'AgentActionProposal',
      entityId: id,
      changes: { toolName: proposal.toolName, ...executed },
    });

    const updated = await this.prisma.agentActionProposal.findUniqueOrThrow({ where: { id } });
    return toAgentAction(updated);
  }

  async rejectAction(user: AuthenticatedUser, id: string): Promise<AgentActionProposal> {
    const tenantId = await this.requireTenantId(user);
    const proposal = await this.prisma.agentActionProposal.findFirst({
      where: { id, tenantId, userId: user.id },
    });

    if (!proposal) {
      throw AppException.notFound('Aksiyon önerisi', id);
    }
    if (proposal.status !== 'PENDING_APPROVAL') {
      throw new AppException('CONFLICT', {
        message: 'Bu aksiyon zaten karara bağlanmış.',
        context: { status: proposal.status },
      });
    }

    const updated = await this.prisma.agentActionProposal.update({
      where: { id },
      data: { status: 'REJECTED', decidedAt: new Date() },
    });

    await this.audit.record({
      actorId: user.id,
      action: 'agent.action.reject',
      entityType: 'AgentActionProposal',
      entityId: id,
      changes: { toolName: proposal.toolName },
    });

    return toAgentAction(updated);
  }

  /** Worker: kuyruktaki agent işini aynı tool döngüsünde işler (user mesajı zaten yazılmış). */
  async processQueuedMessage(input: {
    threadId: string;
    messageId: string;
    userId: string;
    tenantId: string;
  }): Promise<void> {
    const message = await this.prisma.agentMessage.findFirst({
      where: { id: input.messageId, threadId: input.threadId, role: 'USER' },
    });
    if (!message) return;

    const thread = await this.prisma.agentThread.findFirst({
      where: {
        id: input.threadId,
        tenantId: input.tenantId,
        userId: input.userId,
        deletedAt: null,
      },
    });
    if (!thread) return;

    const last = await this.prisma.agentMessage.findFirst({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'desc' },
    });
    if (last?.role === 'ASSISTANT') return;

    await this.runAssistantTurn({
      tenantId: input.tenantId,
      userId: input.userId,
      threadId: thread.id,
      messageId: message.id,
      userContent: message.content,
    });
  }

  private async runAssistantTurn(input: {
    tenantId: string;
    userId: string;
    threadId: string;
    messageId: string;
    userContent: string;
  }): Promise<void> {
    const systemPrompt = await this.ai.getSystemPrompt();
    const completion = await this.ai.complete({
      tenantId: input.tenantId,
      operation: 'agent.chat',
      userId: input.userId,
      featureCode: AiFeatureCode.AGENT_CHAT,
      idempotencyKey: `agent-msg:${input.messageId}`,
      messages: [
        { role: AiChatRole.SYSTEM, content: systemPrompt },
        { role: AiChatRole.USER, content: input.userContent },
      ],
      tools: toolDefinitionsForAi(),
      temperature: 0,
    });

    const toolSummaries: string[] = [];
    const metadata: Record<string, unknown> = {
      provider: completion.provider,
      model: completion.model,
      toolCalls: completion.toolCalls,
    };

    for (const call of completion.toolCalls) {
      const result = await this.tools.execute(call.name, call.arguments ?? {}, {
        tenantId: input.tenantId,
        userId: input.userId,
        threadId: input.threadId,
      });
      toolSummaries.push(result.summary);
    }

    const assistantContent =
      toolSummaries.length > 0
        ? toolSummaries.join('\n\n')
        : (completion.content ?? 'Size nasıl yardımcı olabilirim?');

    await this.prisma.agentMessage.create({
      data: {
        threadId: input.threadId,
        role: 'ASSISTANT',
        content: assistantContent,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    await this.prisma.agentThread.update({
      where: { id: input.threadId },
      data: { updatedAt: new Date() },
    });
  }

  private async executeApprovedProposal(
    user: AuthenticatedUser,
    tenantId: string,
    proposal: { id: string; toolName: string; input: unknown },
  ): Promise<Record<string, unknown>> {
    const input = (proposal.input ?? {}) as {
      title?: string;
      body?: string | null;
      dueAt?: string;
    };

    if (proposal.toolName === AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT) {
      const reminder = await this.prisma.$transaction(async (tx) => {
        const created = await tx.reminder.create({
          data: {
            tenantId,
            userId: user.id,
            title: input.title?.trim() || 'Hatırlatma',
            body: input.body ?? null,
            dueAt: input.dueAt ? new Date(input.dueAt) : new Date(Date.now() + 86_400_000),
          },
        });
        await tx.agentActionProposal.update({
          where: { id: proposal.id },
          data: { status: 'EXECUTED', decidedAt: new Date() },
        });
        return created;
      });
      return { reminderId: reminder.id };
    }

    if (proposal.toolName === AGENT_TOOL_NAMES.CREATE_OFFER_DRAFT) {
      // Fiyat/indirim yazılmaz; kullanıcı teklifi kendisi girer.
      const reminder = await this.prisma.$transaction(async (tx) => {
        const created = await tx.reminder.create({
          data: {
            tenantId,
            userId: user.id,
            title: `Teklif taslağı: ${input.title?.trim() || 'Teklif'}`,
            body: input.body ?? null,
            dueAt: new Date(Date.now() + 86_400_000),
          },
        });
        await tx.agentActionProposal.update({
          where: { id: proposal.id },
          data: { status: 'EXECUTED', decidedAt: new Date() },
        });
        return created;
      });
      return { reminderId: reminder.id, kind: 'offer-draft' };
    }

    if (proposal.toolName === AGENT_TOOL_NAMES.CREATE_CAMPAIGN_DRAFT) {
      const business = await this.prisma.business.findFirst({
        where: { providerProfileId: tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!business) {
        throw new AppException('FORBIDDEN', {
          message: 'Kampanya taslağı için işletme bulunamadı.',
        });
      }
      const campaign = await this.prisma.$transaction(async (tx) => {
        const created = await tx.b2bCampaign.create({
          data: {
            businessId: business.id,
            title: input.title?.trim() || 'Kampanya taslağı',
            description: input.body ?? null,
            body: input.body ?? null,
            audience: CampaignAudience.PUBLIC,
            status: CampaignStatus.DRAFT,
            isActive: false,
          },
        });
        await tx.agentActionProposal.update({
          where: { id: proposal.id },
          data: { status: 'EXECUTED', decidedAt: new Date() },
        });
        return created;
      });
      return { campaignId: campaign.id };
    }

    throw new AppException('FORBIDDEN', { message: 'Desteklenmeyen aksiyon.' });
  }

  private async requireTenantId(user: AuthenticatedUser): Promise<string> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!profile) {
      throw AppException.forbiddenResource('Satıcı profili', { userId: user.id });
    }
    return profile.id;
  }

  private async requireThread(tenantId: string, userId: string, id: string) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id, tenantId, userId, deletedAt: null },
    });
    if (!thread) {
      throw AppException.notFound('Agent sohbeti', id);
    }
    return thread;
  }
}
