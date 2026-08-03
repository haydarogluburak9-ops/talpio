import { API_ROUTES } from '@ustapilot/config';
import type {
  AdminCommissionRuleSummary,
  AdminDashboard,
  AdminJobSummary,
  AdminOfferSummary,
  AdminOrderSummary,
  AdminPaymentSummary,
  AdminProviderSummary,
  AdminTransactionSummary,
  AdminUserSummary,
  AuditLogEntry,
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  TransactionType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@ustapilot/types';

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

export interface ListAuditLogsParams extends AdminListParams {
  entityType?: string;
  actorId?: string;
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
  };
}

export type AdminResource = ReturnType<typeof createAdminResource>;
