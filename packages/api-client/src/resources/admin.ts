import { API_ROUTES } from '@talpio/config';
import type {
  AdminCommissionRuleSummary,
  AdminComplaintSummary,
  AdminDashboard,
  AdminJobSummary,
  AdminNotificationSummary,
  AdminOfferSummary,
  AdminOrderSummary,
  AdminPaymentSummary,
  AdminProviderSummary,
  AdminReviewSummary,
  AdminRoleMatrix,
  AdminSupportTicketDetail,
  AdminSupportTicketSummary,
  AdminSystemSetting,
  AdminTransactionSummary,
  AdminUserSummary,
  AuditLogEntry,
  ContentReport,
  ComplaintStatus,
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  NotificationChannel,
  NotificationType,
  PaymentStatus,
  ReviewStatus,
  ServiceCategory,
  SupportMessage,
  SupportTicketStatus,
  TransactionType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@talpio/types';

import type { HttpClient, Paginated } from '../http-client';

export interface AdminListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
}

export interface ListAdminUsersParams extends AdminListParams {
  role?: UserRole[];
  status?: UserStatus[];
}

export interface ListAdminProvidersParams extends AdminListParams {
  verificationStatus?: VerificationStatus[];
}

export interface ListAdminJobsParams extends AdminListParams {
  status?: JobRequestStatus[];
  categoryId?: string;
  cityId?: string;
}

export interface ListAdminOffersParams extends AdminListParams {
  status?: OfferStatus[];
  jobRequestId?: string;
}

export interface ListAdminOrdersParams extends AdminListParams {
  status?: OrderStatus[];
}

export interface ListAdminPaymentsParams extends AdminListParams {
  status?: PaymentStatus[];
  orderId?: string;
}

export interface ListAdminTransactionsParams extends AdminListParams {
  type?: TransactionType[];
  orderId?: string;
}

export interface ListAdminCommissionsParams extends AdminListParams {
  isActive?: boolean;
}

export interface ListAdminNotificationsParams extends AdminListParams {
  type?: NotificationType[];
  channel?: NotificationChannel[];
  userId?: string;
  unread?: boolean;
}

export interface ListAdminSupportTicketsParams extends AdminListParams {
  status?: SupportTicketStatus[];
}

export interface UpdateAdminSupportTicketBody {
  status?: SupportTicketStatus;
  assignedToUserId?: string | null;
}

export interface AdminSupportTicketReplyBody {
  body: string;
  attachmentFileIds?: string[];
}

export interface ListAdminComplaintsParams extends AdminListParams {
  status?: ComplaintStatus[];
}

export interface UpdateAdminComplaintBody {
  status?: ComplaintStatus;
  resolutionNote?: string;
}

export interface ListAuditLogsParams extends AdminListParams {
  entityType?: string;
  actorId?: string;
}

export interface ListAdminReviewsParams extends AdminListParams {
  status?: ReviewStatus[];
}

export interface UpdateAdminReviewBody {
  status: Extract<ReviewStatus, 'PUBLISHED' | 'HIDDEN'>;
  moderationNote?: string;
}

export interface UpdateAdminSettingBody {
  key: string;
  value: unknown;
}

export function createAdminResource(http: HttpClient) {
  return {
    dashboard(signal?: AbortSignal): Promise<AdminDashboard> {
      return http.get<AdminDashboard>(API_ROUTES.admin.dashboard, {
        ...(signal ? { signal } : {}),
      });
    },

    listUsers(
      params: ListAdminUsersParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminUserSummary>> {
      return http.paginated<AdminUserSummary>(API_ROUTES.admin.users, {
        method: 'GET',
        query: {
          ...params,
          role: params.role?.join(','),
          status: params.status?.join(','),
        },
        ...(signal ? { signal } : {}),
      });
    },

    getUser(id: string, signal?: AbortSignal): Promise<AdminUserSummary> {
      return http.get<AdminUserSummary>(API_ROUTES.admin.userById(id), {
        ...(signal ? { signal } : {}),
      });
    },

    updateUserStatus(id: string, status: UserStatus, reason?: string): Promise<AdminUserSummary> {
      return http.patch<AdminUserSummary>(API_ROUTES.admin.userStatus(id), {
        status,
        ...(reason ? { reason } : {}),
      });
    },

    revokeUserSessions(id: string): Promise<{ revokedCount: number }> {
      return http.post<{ revokedCount: number }>(API_ROUTES.admin.userRevokeSessions(id));
    },

    listProviders(
      params: ListAdminProvidersParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminProviderSummary>> {
      return http.paginated<AdminProviderSummary>(API_ROUTES.admin.providers, {
        method: 'GET',
        query: { ...params, verificationStatus: params.verificationStatus?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listProviderDocuments(id: string, signal?: AbortSignal) {
      return http.get<
        Array<{
          id: string;
          type: string;
          status: string;
          mimeType: string;
          originalName: string | null;
          url: string;
          createdAt: string;
          rejectionReason: string | null;
        }>
      >(API_ROUTES.admin.providerDocumentsById(id), { ...(signal ? { signal } : {}) });
    },

    updateProviderVerification(
      id: string,
      verificationStatus: VerificationStatus,
      reason?: string,
    ): Promise<AdminProviderSummary> {
      return http.patch<AdminProviderSummary>(API_ROUTES.admin.providerVerification(id), {
        verificationStatus,
        ...(reason ? { reason } : {}),
      });
    },

    listJobs(
      params: ListAdminJobsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminJobSummary>> {
      return http.paginated<AdminJobSummary>(API_ROUTES.admin.jobs, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listOffers(
      params: ListAdminOffersParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminOfferSummary>> {
      return http.paginated<AdminOfferSummary>(API_ROUTES.admin.offers, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listOrders(
      params: ListAdminOrdersParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminOrderSummary>> {
      return http.paginated<AdminOrderSummary>(API_ROUTES.admin.orders, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listPayments(
      params: ListAdminPaymentsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminPaymentSummary>> {
      return http.paginated<AdminPaymentSummary>(API_ROUTES.admin.payments, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listTransactions(
      params: ListAdminTransactionsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminTransactionSummary>> {
      return http.paginated<AdminTransactionSummary>(API_ROUTES.admin.transactions, {
        method: 'GET',
        query: { ...params, type: params.type?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listCommissionRules(
      params: ListAdminCommissionsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminCommissionRuleSummary>> {
      return http.paginated<AdminCommissionRuleSummary>(API_ROUTES.admin.commissions, {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listNotifications(
      params: ListAdminNotificationsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminNotificationSummary>> {
      return http.paginated<AdminNotificationSummary>(API_ROUTES.admin.notifications, {
        method: 'GET',
        query: {
          ...params,
          type: params.type?.join(','),
          channel: params.channel?.join(','),
        },
        ...(signal ? { signal } : {}),
      });
    },

    listSupportTickets(
      params: ListAdminSupportTicketsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminSupportTicketSummary>> {
      return http.paginated<AdminSupportTicketSummary>(API_ROUTES.admin.supportTickets, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    getSupportTicket(id: string, signal?: AbortSignal): Promise<AdminSupportTicketDetail> {
      return http.get<AdminSupportTicketDetail>(API_ROUTES.admin.supportTicketById(id), {
        ...(signal ? { signal } : {}),
      });
    },

    updateSupportTicket(
      id: string,
      body: UpdateAdminSupportTicketBody,
    ): Promise<AdminSupportTicketDetail> {
      return http.patch<AdminSupportTicketDetail>(API_ROUTES.admin.supportTicketById(id), body);
    },

    replySupportTicket(id: string, body: AdminSupportTicketReplyBody): Promise<SupportMessage> {
      return http.post<SupportMessage>(API_ROUTES.admin.supportTicketMessages(id), body);
    },

    listComplaints(
      params: ListAdminComplaintsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminComplaintSummary>> {
      return http.paginated<AdminComplaintSummary>(API_ROUTES.admin.complaints, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    updateComplaint(id: string, body: UpdateAdminComplaintBody): Promise<AdminComplaintSummary> {
      return http.patch<AdminComplaintSummary>(API_ROUTES.admin.complaintById(id), body);
    },

    listAuditLogs(
      params: ListAuditLogsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AuditLogEntry>> {
      return http.paginated<AuditLogEntry>(API_ROUTES.admin.auditLogs, {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listReviews(
      params: ListAdminReviewsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<AdminReviewSummary>> {
      return http.paginated<AdminReviewSummary>(API_ROUTES.admin.reviews, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    updateReview(id: string, body: UpdateAdminReviewBody): Promise<AdminReviewSummary> {
      return http.patch<AdminReviewSummary>(API_ROUTES.admin.reviewById(id), body);
    },

    listSettings(signal?: AbortSignal): Promise<AdminSystemSetting[]> {
      return http.get<AdminSystemSetting[]>(API_ROUTES.admin.settings, {
        ...(signal ? { signal } : {}),
      });
    },

    updateSetting(body: UpdateAdminSettingBody): Promise<AdminSystemSetting> {
      return http.patch<AdminSystemSetting>(API_ROUTES.admin.settings, body);
    },

    listRoles(signal?: AbortSignal): Promise<AdminRoleMatrix> {
      return http.get<AdminRoleMatrix>(API_ROUTES.admin.settingsRoles, {
        ...(signal ? { signal } : {}),
      });
    },

    listCategories(signal?: AbortSignal): Promise<ServiceCategory[]> {
      return http.get<ServiceCategory[]>(API_ROUTES.admin.categories, {
        ...(signal ? { signal } : {}),
      });
    },

    createCategory(body: {
      name: string;
      slug: string;
      description?: string;
      iconKey?: string;
      sortOrder?: number;
    }): Promise<ServiceCategory> {
      return http.post<ServiceCategory>(API_ROUTES.admin.categories, body);
    },

    updateCategory(
      id: string,
      body: {
        name?: string;
        description?: string | null;
        iconKey?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      },
    ): Promise<ServiceCategory> {
      return http.patch<ServiceCategory>(API_ROUTES.admin.categoryById(id), body);
    },

    listSubscriptions(signal?: AbortSignal) {
      return http.get(API_ROUTES.admin.subscriptions, { ...(signal ? { signal } : {}) });
    },

    listAiUsage(signal?: AbortSignal) {
      return http.get(API_ROUTES.admin.aiUsage, { ...(signal ? { signal } : {}) });
    },

    listCampaigns(signal?: AbortSignal) {
      return http.get(API_ROUTES.admin.campaigns, { ...(signal ? { signal } : {}) });
    },

    listModerationReports(
      params: { status?: string; targetType?: string; q?: string } = {},
      signal?: AbortSignal,
    ) {
      return http.get<ContentReport[]>(API_ROUTES.admin.moderationReports, {
        query: params,
        ...(signal ? { signal } : {}),
      });
    },

    bulkUpdateModerationReports(body: {
      ids: string[];
      status: string;
      action?: string;
      actionNote?: string;
    }) {
      return http.post<{ updated: number }>(`${API_ROUTES.admin.moderationReports}/bulk`, body);
    },

    updateModerationReport(
      id: string,
      body: { status: string; action?: string; actionNote?: string },
    ) {
      return http.patch<ContentReport>(API_ROUTES.admin.moderationReportById(id), body);
    },

    listCommerceRequests(signal?: AbortSignal) {
      return http.get(API_ROUTES.admin.commerceRequests, { ...(signal ? { signal } : {}) });
    },

    listFraudFlags(params: { status?: string } = {}, signal?: AbortSignal) {
      return http.get(API_ROUTES.admin.fraudFlags, {
        query: params,
        ...(signal ? { signal } : {}),
      });
    },

    updateFraudFlag(id: string, body: { status: string; note?: string }) {
      return http.patch(API_ROUTES.admin.fraudFlagById(id), body);
    },

    getBackupStatus(signal?: AbortSignal) {
      return http.get<{
        lastVerifiedAt: string | null;
        lastVerifiedBy: string | null;
        lastNote: string | null;
        checklist: string[];
        runbook: string;
        claimedAutomaticBackup: false;
      }>(API_ROUTES.admin.backupStatus, { ...(signal ? { signal } : {}) });
    },

    verifyBackup(body: { note?: string } = {}) {
      return http.post(API_ROUTES.admin.backupVerify, body);
    },

    listDeadLetters(signal?: AbortSignal) {
      return http.get(API_ROUTES.admin.queueDeadLetters, { ...(signal ? { signal } : {}) });
    },
  };
}

export type AdminResource = ReturnType<typeof createAdminResource>;
