import { Injectable } from '@nestjs/common';
import {
  BusinessTaskPriority,
  BusinessTaskStatus,
  CrmCustomerSource,
  OrderStatus,
  RequestOfferStatus,
  RequestStatus,
  WorkOrderSource,
  WorkOrderStage,
  type BusinessDashboardV2,
  type BusinessTaskRow,
  type CrmCustomerDetail,
  type CrmCustomerRow,
  type WorkOrderRow,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { CurrencyService } from '@infra/currency/currency.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { RbacService } from '@modules/rbac/rbac.service';

@Injectable()
export class BusinessOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly audit: AuditLogService,
    private readonly currency: CurrencyService,
  ) {}

  async listCrmCustomers(user: AuthenticatedUser, businessId: string): Promise<CrmCustomerRow[]> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const rows = await this.prisma.crmCustomer.findMany({
      where: { tenantId: businessId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: { _count: { select: { workOrders: true } } },
    });
    return rows.map((row) => this.toCustomerRow(row));
  }

  async createCrmCustomer(
    user: AuthenticatedUser,
    businessId: string,
    dto: {
      displayName: string;
      phone?: string | null;
      email?: string | null;
      notes?: string | null;
      source?: CrmCustomerSource;
      tags?: string[];
    },
  ): Promise<CrmCustomerRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const row = await this.prisma.crmCustomer.create({
      data: {
        tenantId: businessId,
        displayName: dto.displayName.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        notes: dto.notes?.trim() || null,
        source: dto.source ?? CrmCustomerSource.OTHER,
        tags: dto.tags ?? [],
      },
      include: { _count: { select: { workOrders: true } } },
    });
    await this.audit.record({
      actorId: user.id,
      action: 'crm.customer.create',
      entityType: 'CrmCustomer',
      entityId: row.id,
      changes: { businessId, source: row.source },
    });
    return this.toCustomerRow(row);
  }

  async getCrmCustomer(
    user: AuthenticatedUser,
    businessId: string,
    customerId: string,
  ): Promise<CrmCustomerDetail> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const row = await this.prisma.crmCustomer.findFirst({
      where: { id: customerId, tenantId: businessId, deletedAt: null },
      include: {
        _count: { select: { workOrders: true } },
        noteEntries: { orderBy: { createdAt: 'desc' }, take: 50 },
        followUps: { orderBy: { dueAt: 'asc' }, take: 50 },
        workOrders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            stage: true,
            source: true,
            createdAt: true,
          },
        },
      },
    });
    if (!row) throw AppException.notFound('Müşteri', customerId);

    return {
      ...this.toCustomerRow(row),
      notesList: row.noteEntries.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        fileAssetId: n.fileAssetId ?? null,
      })),
      followUps: row.followUps.map((f) => ({
        id: f.id,
        dueAt: f.dueAt.toISOString(),
        body: f.body,
        completedAt: f.completedAt?.toISOString() ?? null,
      })),
      workOrders: row.workOrders.map((wo) => ({
        id: wo.id,
        title: wo.title,
        stage: wo.stage,
        source: wo.source,
        createdAt: wo.createdAt.toISOString(),
      })),
    };
  }

  async addCrmNote(
    user: AuthenticatedUser,
    businessId: string,
    customerId: string,
    body: string,
    fileAssetId?: string | null,
  ) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const customer = await this.prisma.crmCustomer.findFirst({
      where: { id: customerId, tenantId: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!customer) throw AppException.notFound('Müşteri', customerId);
    if (fileAssetId) {
      const file = await this.prisma.fileAsset.findFirst({
        where: { id: fileAssetId, ownerUserId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!file) throw AppException.notFound('Dosya', fileAssetId);
    }
    return this.prisma.crmCustomerNote.create({
      data: { customerId, body: body.trim(), fileAssetId: fileAssetId ?? null },
    });
  }

  async addCrmFollowUp(
    user: AuthenticatedUser,
    businessId: string,
    customerId: string,
    dto: { dueAt: string; body: string },
  ) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const customer = await this.prisma.crmCustomer.findFirst({
      where: { id: customerId, tenantId: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!customer) throw AppException.notFound('Müşteri', customerId);
    const row = await this.prisma.crmFollowUp.create({
      data: {
        customerId,
        dueAt: new Date(dto.dueAt),
        body: dto.body.trim(),
      },
    });
    await this.prisma.crmCustomer.update({
      where: { id: customerId },
      data: { lastContactAt: new Date(), nextAction: dto.body.trim().slice(0, 200) },
    });
    return {
      id: row.id,
      dueAt: row.dueAt.toISOString(),
      body: row.body,
      completedAt: null,
    };
  }

  async completeCrmFollowUp(
    user: AuthenticatedUser,
    businessId: string,
    customerId: string,
    followUpId: string,
  ) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const row = await this.prisma.crmFollowUp.findFirst({
      where: { id: followUpId, customerId, customer: { tenantId: businessId } },
    });
    if (!row) throw AppException.notFound('Takip', followUpId);
    const updated = await this.prisma.crmFollowUp.update({
      where: { id: followUpId },
      data: { completedAt: new Date() },
    });
    return {
      id: updated.id,
      dueAt: updated.dueAt.toISOString(),
      body: updated.body,
      completedAt: updated.completedAt?.toISOString() ?? null,
    };
  }

  async crmAnalytics(user: AuthenticatedUser, businessId: string) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const now = new Date();
    const [customerCount, openFollowUps, overdueFollowUps, lifetime] = await Promise.all([
      this.prisma.crmCustomer.count({ where: { tenantId: businessId, deletedAt: null } }),
      this.prisma.crmFollowUp.count({
        where: { completedAt: null, customer: { tenantId: businessId, deletedAt: null } },
      }),
      this.prisma.crmFollowUp.count({
        where: {
          completedAt: null,
          dueAt: { lt: now },
          customer: { tenantId: businessId, deletedAt: null },
        },
      }),
      this.prisma.crmCustomer.aggregate({
        where: { tenantId: businessId, deletedAt: null },
        _sum: { lifetimeValueMinor: true },
      }),
    ]);
    return {
      customerCount,
      openFollowUps,
      overdueFollowUps,
      lifetimeValueMinor: lifetime._sum.lifetimeValueMinor ?? 0,
    };
  }

  async listWorkOrders(user: AuthenticatedUser, businessId: string): Promise<WorkOrderRow[]> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const rows = await this.prisma.workOrder.findMany({
      where: { tenantId: businessId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { customer: { select: { id: true, displayName: true } } },
    });
    return rows.map((row) => this.toWorkOrder(row));
  }

  async createWorkOrder(
    user: AuthenticatedUser,
    businessId: string,
    dto: {
      customerId: string;
      title: string;
      source?: WorkOrderSource;
      stage?: WorkOrderStage;
      notes?: string | null;
      scheduledAt?: string | null;
    },
  ): Promise<WorkOrderRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const customer = await this.prisma.crmCustomer.findFirst({
      where: { id: dto.customerId, tenantId: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!customer) throw AppException.notFound('Müşteri', dto.customerId);

    const row = await this.prisma.workOrder.create({
      data: {
        tenantId: businessId,
        customerId: dto.customerId,
        title: dto.title.trim(),
        source: dto.source ?? WorkOrderSource.OTHER,
        stage: dto.stage ?? WorkOrderStage.NEW,
        notes: dto.notes?.trim() || null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
      include: { customer: { select: { id: true, displayName: true } } },
    });
    await this.audit.record({
      actorId: user.id,
      action: 'workorder.create',
      entityType: 'WorkOrder',
      entityId: row.id,
      changes: { businessId, source: row.source },
    });
    return this.toWorkOrder(row);
  }

  async updateWorkOrderStage(
    user: AuthenticatedUser,
    businessId: string,
    workOrderId: string,
    stage: WorkOrderStage,
  ): Promise<WorkOrderRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const existing = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId: businessId, deletedAt: null },
      select: { id: true, stage: true },
    });
    if (!existing) throw AppException.notFound('İş emri', workOrderId);
    const row = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: { stage },
      include: { customer: { select: { id: true, displayName: true } } },
    });
    await this.audit.record({
      actorId: user.id,
      action: 'workorder.stage',
      entityType: 'WorkOrder',
      entityId: workOrderId,
      changes: { from: existing.stage, to: stage },
    });
    return this.toWorkOrder(row);
  }

  async listWorkOrderBoard(user: AuthenticatedUser, businessId: string) {
    const rows = await this.listWorkOrders(user, businessId);
    const columns: Record<string, WorkOrderRow[]> = {};
    for (const stage of Object.values(WorkOrderStage)) {
      columns[stage] = [];
    }
    for (const row of rows) {
      const list = columns[row.stage] ?? (columns[row.stage] = []);
      list.push(row);
    }
    return { columns };
  }

  async assignWorkOrder(
    user: AuthenticatedUser,
    businessId: string,
    workOrderId: string,
    assigneeUserId: string,
  ): Promise<WorkOrderRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const existing = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw AppException.notFound('İş emri', workOrderId);
    await this.rbac.assertBusinessAccess(assigneeUserId, businessId);
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.workOrderAssignment.upsert({
        where: {
          workOrderId_userId: { workOrderId, userId: assigneeUserId },
        },
        update: {},
        create: { workOrderId, userId: assigneeUserId },
      });
      return tx.workOrder.update({
        where: { id: workOrderId },
        data: { assignedUserId: assigneeUserId },
        include: { customer: { select: { id: true, displayName: true } } },
      });
    });
    await this.audit.record({
      actorId: user.id,
      action: 'workorder.assign',
      entityType: 'WorkOrder',
      entityId: workOrderId,
      changes: { assigneeUserId },
    });
    return this.toWorkOrder(row);
  }

  async listTasks(user: AuthenticatedUser, businessId: string): Promise<BusinessTaskRow[]> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const rows = await this.prisma.businessTask.findMany({
      where: { tenantId: businessId, deletedAt: null },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return rows.map((row) => this.toTask(row));
  }

  async createTask(
    user: AuthenticatedUser,
    businessId: string,
    dto: {
      title: string;
      workOrderId?: string | null;
      assigneeUserId?: string | null;
      priority?: BusinessTaskPriority;
      dueAt?: string | null;
    },
  ): Promise<BusinessTaskRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    if (dto.workOrderId) {
      const wo = await this.prisma.workOrder.findFirst({
        where: { id: dto.workOrderId, tenantId: businessId, deletedAt: null },
        select: { id: true },
      });
      if (!wo) throw AppException.notFound('İş emri', dto.workOrderId);
    }
    const row = await this.prisma.businessTask.create({
      data: {
        tenantId: businessId,
        title: dto.title.trim(),
        workOrderId: dto.workOrderId ?? null,
        assigneeUserId: dto.assigneeUserId ?? null,
        priority: dto.priority ?? BusinessTaskPriority.MEDIUM,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
    });
    await this.audit.record({
      actorId: user.id,
      action: 'task.create',
      entityType: 'BusinessTask',
      entityId: row.id,
      changes: { businessId },
    });
    return this.toTask(row);
  }

  async updateTaskStatus(
    user: AuthenticatedUser,
    businessId: string,
    taskId: string,
    status: BusinessTaskStatus,
  ): Promise<BusinessTaskRow> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const existing = await this.prisma.businessTask.findFirst({
      where: { id: taskId, tenantId: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw AppException.notFound('Görev', taskId);
    const row = await this.prisma.businessTask.update({
      where: { id: taskId },
      data: { status },
    });
    return this.toTask(row);
  }

  async dashboard(user: AuthenticatedUser, businessId: string): Promise<BusinessDashboardV2> {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { providerProfileId: true, socialProfile: { select: { id: true } } },
    });
    if (!business) throw AppException.notFound('İşletme', businessId);

    const providerId = business.providerProfileId;
    const start = startOfDay(0);
    const end = startOfDay(1);
    const upcomingEnd = startOfDay(8);

    const [
      todayJobs,
      upcomingJobs,
      pendingOffers,
      pendingPayments,
      openRequests,
      leadCount,
      acceptedOffers,
      totalOffers,
      revenue,
      socialAgg,
      dealPostCount,
    ] = await Promise.all([
      this.prisma.workOrder.count({
        where: {
          tenantId: businessId,
          deletedAt: null,
          scheduledAt: { gte: start, lt: end },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          tenantId: businessId,
          deletedAt: null,
          scheduledAt: { gte: end, lt: upcomingEnd },
        },
      }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null, status: RequestOfferStatus.SUBMITTED },
      }),
      providerId
        ? this.prisma.order.count({
            where: {
              providerProfileId: providerId,
              deletedAt: null,
              status: OrderStatus.PENDING_PAYMENT,
            },
          })
        : Promise.resolve(0),
      this.prisma.commerceRequest.count({
        where: {
          deletedAt: null,
          matches: { some: { businessId } },
          status: {
            in: [RequestStatus.PUBLISHED, RequestStatus.MATCHING, RequestStatus.QUOTING],
          },
        },
      }),
      this.prisma.crmCustomer.count({
        where: { tenantId: businessId, deletedAt: null },
      }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null, status: RequestOfferStatus.ACCEPTED },
      }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null },
      }),
      providerId
        ? this.prisma.order.aggregate({
            where: {
              providerProfileId: providerId,
              deletedAt: null,
              status: { in: [OrderStatus.COMPLETED, OrderStatus.PAID] },
            },
            _sum: { payoutMinor: true },
          })
        : Promise.resolve({ _sum: { payoutMinor: 0 } }),
      business.socialProfile
        ? this.prisma.post.aggregate({
            where: { authorProfileId: business.socialProfile.id, deletedAt: null },
            _sum: { viewCount: true, likeCount: true },
            _count: { _all: true },
          })
        : Promise.resolve({
            _sum: { viewCount: 0, likeCount: 0 },
            _count: { _all: 0 },
          }),
      business.socialProfile
        ? this.prisma.post.count({
            where: {
              authorProfileId: business.socialProfile.id,
              deletedAt: null,
              dealMetadata: { isNot: null },
            },
          })
        : Promise.resolve(0),
    ]);

    return {
      todayJobs,
      upcomingJobs,
      pendingOffers,
      pendingPayments,
      openRequests,
      leadCount,
      conversionRate: totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : null,
      revenueMinor: revenue._sum.payoutMinor ?? 0,
      currency: await this.currency.forBusiness(businessId),
      social: {
        postCount: socialAgg._count._all,
        totalViews: socialAgg._sum.viewCount ?? 0,
        totalLikes: socialAgg._sum.likeCount ?? 0,
        dealPostCount,
      },
    };
  }

  private toCustomerRow(row: {
    id: string;
    displayName: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    userId: string | null;
    source: CrmCustomerSource;
    tags: string[];
    lastContactAt: Date | null;
    nextAction: string | null;
    lifetimeValueMinor: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { workOrders: number };
  }): CrmCustomerRow {
    return {
      id: row.id,
      displayName: row.displayName,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      userId: row.userId,
      source: row.source,
      tags: row.tags,
      lastContactAt: row.lastContactAt?.toISOString() ?? null,
      nextAction: row.nextAction,
      lifetimeValueMinor: row.lifetimeValueMinor,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      _count: row._count,
    };
  }

  private toWorkOrder(row: {
    id: string;
    tenantId: string;
    customerId: string;
    source: WorkOrderSource;
    stage: WorkOrderStage;
    title: string;
    notes: string | null;
    scheduledAt: Date | null;
    assignedUserId: string | null;
    marketplaceOrderId: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { id: string; displayName: string } | null;
  }): WorkOrderRow {
    return {
      id: row.id,
      tenantId: row.tenantId,
      customerId: row.customerId,
      source: row.source,
      stage: row.stage,
      title: row.title,
      notes: row.notes,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      assignedUserId: row.assignedUserId,
      marketplaceOrderId: row.marketplaceOrderId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customer: row.customer ?? null,
    };
  }

  private toTask(row: {
    id: string;
    tenantId: string;
    workOrderId: string | null;
    assigneeUserId: string | null;
    title: string;
    status: BusinessTaskStatus;
    priority: BusinessTaskPriority;
    dueAt: Date | null;
    createdAt: Date;
  }): BusinessTaskRow {
    return {
      id: row.id,
      tenantId: row.tenantId,
      workOrderId: row.workOrderId,
      assigneeUserId: row.assigneeUserId,
      title: row.title,
      status: row.status,
      priority: row.priority,
      dueAt: row.dueAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function startOfDay(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}
