import { Injectable } from '@nestjs/common';
import {
  AGENT_TOOL_KIND,
  AGENT_TOOL_NAMES,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  type AgentToolName,
  type MonthlyRevenueSummary,
} from '@talpio/types';
import { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import { AppException } from '@common/errors/app.exception';
import { CurrencyService } from '@infra/currency/currency.service';
import { PrismaService } from '@infra/prisma/prisma.service';

import { AGENT_TOOL_REGISTRY, isAllowedToolName } from './agent-tool.registry';

const EMPTY = 'Kayıt bulunamadı.';

export interface AgentToolContext {
  tenantId: string;
  userId: string;
  threadId: string;
}

export interface AgentToolResult {
  summary: string;
  data: unknown;
  /** WRITE tool'ları için onay kaydı kimliği. */
  proposalId?: string;
  requiresApproval: boolean;
}

const reminderDraftSchema = z.object({
  title: z.string().min(1).max(200).default('Hatırlatma'),
  body: z.string().max(2000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1).max(120),
});

@Injectable()
export class AgentToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currency: CurrencyService,
  ) {}

  async execute(
    toolName: string,
    args: Record<string, unknown>,
    ctx: AgentToolContext,
  ): Promise<AgentToolResult> {
    if (!isAllowedToolName(toolName)) {
      throw new AppException('FORBIDDEN', {
        message: 'İzin verilmeyen tool.',
        context: { toolName },
      });
    }

    const def = AGENT_TOOL_REGISTRY[toolName];
    const started = Date.now();

    try {
      const result =
        def.kind === AGENT_TOOL_KIND.WRITE
          ? await this.executeWrite(toolName, args, ctx)
          : await this.executeRead(toolName, args, ctx);

      await this.logInvocation({
        ctx,
        toolName,
        input: args,
        resultSummary: result.summary.slice(0, 500),
        success: true,
        durationMs: Date.now() - started,
        approvalStatus: result.requiresApproval ? 'PENDING_APPROVAL' : null,
      });

      return result;
    } catch (error) {
      await this.logInvocation({
        ctx,
        toolName,
        input: args,
        resultSummary: error instanceof Error ? error.message : 'tool_error',
        success: false,
        durationMs: Date.now() - started,
        approvalStatus: null,
      });
      throw error;
    }
  }

  private async executeRead(
    toolName: AgentToolName,
    args: Record<string, unknown>,
    ctx: AgentToolContext,
  ): Promise<AgentToolResult> {
    switch (toolName) {
      case AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE:
        return this.scheduleForDay(ctx.tenantId, 0);
      case AGENT_TOOL_NAMES.GET_TOMORROW_SCHEDULE:
        return this.scheduleForDay(ctx.tenantId, 1);
      case AGENT_TOOL_NAMES.GET_PENDING_OFFERS:
        return this.getPendingOffers(ctx.tenantId);
      case AGENT_TOOL_NAMES.GET_PENDING_PAYMENTS:
        return this.getPendingPayments(ctx.tenantId);
      case AGENT_TOOL_NAMES.GET_ACTIVE_ORDERS:
        return this.getActiveOrders(ctx.tenantId);
      case AGENT_TOOL_NAMES.GET_RECENT_NOTIFICATIONS:
        return this.getRecentNotifications(ctx.userId);
      case AGENT_TOOL_NAMES.GET_MONTHLY_REVENUE_SUMMARY:
        return this.getMonthlyRevenueSummary(ctx.tenantId);
      case AGENT_TOOL_NAMES.SEARCH_CUSTOMER_OR_ORDER: {
        const parsed = searchSchema.safeParse(args);
        if (!parsed.success) {
          return { summary: EMPTY, data: [], requiresApproval: false };
        }
        return this.searchCustomerOrOrder(ctx.tenantId, parsed.data.query);
      }
      case AGENT_TOOL_NAMES.GET_OPEN_REQUESTS:
        return this.getOpenRequests(ctx.tenantId);
      case AGENT_TOOL_NAMES.GET_RECENT_CUSTOMERS:
        return this.getRecentCustomers(ctx.tenantId);
      case AGENT_TOOL_NAMES.GET_SOCIAL_PERFORMANCE:
        return this.getSocialPerformance(ctx.tenantId);
      case AGENT_TOOL_NAMES.SEARCH_WORK_ORDER: {
        const parsed = searchSchema.safeParse(args);
        if (!parsed.success) {
          return { summary: EMPTY, data: [], requiresApproval: false };
        }
        return this.searchWorkOrder(ctx.tenantId, parsed.data.query);
      }
      default:
        throw new AppException('FORBIDDEN', { message: 'Okuma tool bulunamadı.' });
    }
  }

  private async executeWrite(
    toolName: AgentToolName,
    args: Record<string, unknown>,
    ctx: AgentToolContext,
  ): Promise<AgentToolResult> {
    if (toolName === AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT) {
      const parsed = reminderDraftSchema.safeParse(args);
      const input = parsed.success ? parsed.data : { title: 'Hatırlatma', body: null, dueAt: null };
      const dueAt = input.dueAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return this.createWriteProposal(ctx, toolName, `Hatırlatma: ${input.title} (${dueAt})`, {
        title: input.title,
        body: input.body ?? null,
        dueAt,
      });
    }

    if (toolName === AGENT_TOOL_NAMES.CREATE_OFFER_DRAFT) {
      const title = typeof args.title === 'string' ? args.title : 'Teklif taslağı';
      return this.createWriteProposal(ctx, toolName, `Teklif taslağı: ${title}`, {
        title,
        body: typeof args.body === 'string' ? args.body : null,
        requestId: typeof args.requestId === 'string' ? args.requestId : null,
      });
    }

    if (toolName === AGENT_TOOL_NAMES.CREATE_CAMPAIGN_DRAFT) {
      const title = typeof args.title === 'string' ? args.title : 'Kampanya taslağı';
      return this.createWriteProposal(ctx, toolName, `Kampanya taslağı: ${title}`, {
        title,
        body: typeof args.body === 'string' ? args.body : null,
      });
    }

    throw new AppException('FORBIDDEN', { message: 'Yazma tool bulunamadı.' });
  }

  private async createWriteProposal(
    ctx: AgentToolContext,
    toolName: AgentToolName,
    summary: string,
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    const proposal = await this.prisma.agentActionProposal.create({
      data: {
        threadId: ctx.threadId,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        toolName,
        summary,
        input: input as Prisma.InputJsonValue,
        status: 'PENDING_APPROVAL',
      },
    });

    return {
      summary: `Onay bekleniyor: ${proposal.summary}`,
      data: { proposalId: proposal.id, ...input },
      proposalId: proposal.id,
      requiresApproval: true,
    };
  }

  private async scheduleForDay(tenantId: string, dayOffset: number): Promise<AgentToolResult> {
    const { start, end } = dayBounds(dayOffset);
    const rows = await this.prisma.order.findMany({
      where: {
        providerProfileId: tenantId,
        deletedAt: null,
        status: {
          in: [
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PAID,
            OrderStatus.IN_PROGRESS,
            OrderStatus.AWAITING_APPROVAL,
          ],
        },
        OR: [{ scheduledAt: { gte: start, lt: end } }, { startedAt: { gte: start, lt: end } }],
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        totalMinor: true,
        currency: true,
        jobRequest: { select: { title: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { startedAt: 'asc' }],
      take: 50,
    });

    if (rows.length === 0) {
      return { summary: EMPTY, data: [], requiresApproval: false };
    }

    const lines = rows.map(
      (row) => `• ${row.jobRequest?.title ?? 'Sipariş'} — ${row.customer.fullName} (${row.status})`,
    );
    return {
      summary: lines.join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getPendingOffers(tenantId: string): Promise<AgentToolResult> {
    const rows = await this.prisma.offer.findMany({
      where: {
        providerProfileId: tenantId,
        status: OfferStatus.SUBMITTED,
        deletedAt: null,
      },
      select: {
        id: true,
        amountMinor: true,
        currency: true,
        validUntil: true,
        jobRequest: { select: { title: true, customer: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (rows.length === 0) {
      return { summary: EMPTY, data: [], requiresApproval: false };
    }

    return {
      summary: rows
        .map(
          (row) =>
            `• ${row.jobRequest?.title ?? 'Teklif'} — ${row.jobRequest?.customer.fullName ?? ''} (${row.amountMinor} ${row.currency})`,
        )
        .join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getPendingPayments(tenantId: string): Promise<AgentToolResult> {
    const rows = await this.prisma.order.findMany({
      where: {
        providerProfileId: tenantId,
        status: OrderStatus.PENDING_PAYMENT,
        deletedAt: null,
      },
      select: {
        id: true,
        totalMinor: true,
        currency: true,
        jobRequest: { select: { title: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (rows.length === 0) {
      return { summary: EMPTY, data: [], requiresApproval: false };
    }

    return {
      summary: rows
        .map(
          (row) =>
            `• ${row.jobRequest?.title ?? 'Sipariş'} — ${row.customer.fullName}: ${row.totalMinor} ${row.currency}`,
        )
        .join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getActiveOrders(tenantId: string): Promise<AgentToolResult> {
    const rows = await this.prisma.order.findMany({
      where: {
        providerProfileId: tenantId,
        deletedAt: null,
        status: {
          in: [OrderStatus.PAID, OrderStatus.IN_PROGRESS, OrderStatus.AWAITING_APPROVAL],
        },
      },
      select: {
        id: true,
        status: true,
        jobRequest: { select: { title: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    if (rows.length === 0) {
      return { summary: EMPTY, data: [], requiresApproval: false };
    }

    return {
      summary: rows
        .map(
          (row) =>
            `• ${row.jobRequest?.title ?? 'Sipariş'} — ${row.customer.fullName} (${row.status})`,
        )
        .join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getRecentNotifications(userId: string): Promise<AgentToolResult> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, params: true, createdAt: true, readAt: true },
    });

    if (rows.length === 0) {
      return { summary: EMPTY, data: [], requiresApproval: false };
    }

    return {
      summary: rows.map((row) => `• ${row.type}`).join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getMonthlyRevenueSummary(tenantId: string): Promise<AgentToolResult> {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.CAPTURED,
        capturedAt: { gte: start, lt: end },
        order: { providerProfileId: tenantId, deletedAt: null },
      },
      select: { amountMinor: true, currency: true, orderId: true },
    });

    const pending = await this.prisma.order.aggregate({
      where: {
        providerProfileId: tenantId,
        status: OrderStatus.PENDING_PAYMENT,
        deletedAt: null,
      },
      _sum: { totalMinor: true },
      _count: true,
    });

    const collectedMinor = payments.reduce((sum, row) => sum + row.amountMinor, 0);
    const summary: MonthlyRevenueSummary = {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      collectedMinor,
      pendingMinor: pending._sum.totalMinor ?? 0,
      // Tahsilat yoksa gösterilecek bir tutar da yok; etiketi satıcının
      // fiyatlama para biriminden alıyoruz ki "0 TRY" gibi alakasız bir birim
      // görünmesin.
      currency: payments[0]?.currency ?? (await this.providerCurrency(tenantId)),
      orderCount: new Set(payments.map((row) => row.orderId)).size,
    };

    if (summary.collectedMinor === 0 && summary.pendingMinor === 0) {
      return { summary: EMPTY, data: summary, requiresApproval: false };
    }

    return {
      summary: `Bu ay tahsil: ${summary.collectedMinor} ${summary.currency}; bekleyen: ${summary.pendingMinor} ${summary.currency}; sipariş: ${summary.orderCount}`,
      data: summary,
      requiresApproval: false,
    };
  }

  private async searchCustomerOrOrder(tenantId: string, query: string): Promise<AgentToolResult> {
    const rows = await this.prisma.order.findMany({
      where: {
        providerProfileId: tenantId,
        deletedAt: null,
        OR: [
          { customer: { fullName: { contains: query, mode: 'insensitive' } } },
          { jobRequest: { title: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        status: true,
        jobRequest: { select: { title: true } },
        customer: { select: { fullName: true } },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    if (rows.length === 0) {
      return { summary: EMPTY, data: [], requiresApproval: false };
    }

    return {
      summary: rows
        .map(
          (row) =>
            `• ${row.customer.fullName} — ${row.jobRequest?.title ?? 'Sipariş'} (${row.status})`,
        )
        .join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  /** Satıcının ilk işletmesinin para birimi; işletmesi yoksa kurulum varsayılanı. */
  private async providerCurrency(providerProfileId: string): Promise<string> {
    const [businessId] = await this.businessIdsForProvider(providerProfileId);
    return businessId ? this.currency.forBusiness(businessId) : this.currency.fallback;
  }

  private async businessIdsForProvider(providerProfileId: string): Promise<string[]> {
    const rows = await this.prisma.business.findMany({
      where: { providerProfileId, deletedAt: null },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  private async getOpenRequests(tenantId: string): Promise<AgentToolResult> {
    const businessIds = await this.businessIdsForProvider(tenantId);
    const rows = await this.prisma.commerceRequest.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PUBLISHED', 'MATCHING', 'QUOTING'] },
        matches: { some: { businessId: { in: businessIds } } },
      },
      select: { id: true, title: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (rows.length === 0) return { summary: EMPTY, data: [], requiresApproval: false };
    return {
      summary: rows.map((row) => `• ${row.title} (${row.status})`).join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getRecentCustomers(tenantId: string): Promise<AgentToolResult> {
    const businessIds = await this.businessIdsForProvider(tenantId);
    const rows = await this.prisma.crmCustomer.findMany({
      where: { tenantId: { in: businessIds }, deletedAt: null },
      select: { id: true, displayName: true, source: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    if (rows.length === 0) return { summary: EMPTY, data: [], requiresApproval: false };
    return {
      summary: rows.map((row) => `• ${row.displayName} (${row.source})`).join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async getSocialPerformance(tenantId: string): Promise<AgentToolResult> {
    const profile = await this.prisma.socialProfile.findFirst({
      where: { business: { providerProfileId: tenantId, deletedAt: null }, deletedAt: null },
      select: { id: true, followerCount: true, postCount: true },
    });
    if (!profile) return { summary: EMPTY, data: null, requiresApproval: false };
    const agg = await this.prisma.post.aggregate({
      where: { authorProfileId: profile.id, deletedAt: null },
      _sum: { viewCount: true, likeCount: true, shareCount: true },
    });
    const data = {
      followerCount: profile.followerCount,
      postCount: profile.postCount,
      totalViews: agg._sum.viewCount ?? 0,
      totalLikes: agg._sum.likeCount ?? 0,
      totalShares: agg._sum.shareCount ?? 0,
    };
    return {
      summary: `Takipçi ${data.followerCount}; gönderi ${data.postCount}; görüntülenme ${data.totalViews}`,
      data,
      requiresApproval: false,
    };
  }

  private async searchWorkOrder(tenantId: string, query: string): Promise<AgentToolResult> {
    const businessIds = await this.businessIdsForProvider(tenantId);
    const rows = await this.prisma.workOrder.findMany({
      where: {
        tenantId: { in: businessIds },
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { customer: { displayName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        title: true,
        stage: true,
        customer: { select: { displayName: true } },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });
    if (rows.length === 0) return { summary: EMPTY, data: [], requiresApproval: false };
    return {
      summary: rows
        .map((row) => `• ${row.title} — ${row.customer.displayName} (${row.stage})`)
        .join('\n'),
      data: rows,
      requiresApproval: false,
    };
  }

  private async logInvocation(input: {
    ctx: AgentToolContext;
    toolName: string;
    input: Record<string, unknown>;
    resultSummary: string;
    success: boolean;
    durationMs: number;
    approvalStatus: string | null;
  }): Promise<void> {
    await this.prisma.agentToolInvocation.create({
      data: {
        threadId: input.ctx.threadId,
        tenantId: input.ctx.tenantId,
        userId: input.ctx.userId,
        toolName: input.toolName,
        input: input.input as Prisma.InputJsonValue,
        resultSummary: input.resultSummary,
        success: input.success,
        durationMs: input.durationMs,
        approvalStatus: input.approvalStatus,
      },
    });
  }
}

function dayBounds(dayOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset + 1),
  );
  return { start, end };
}
