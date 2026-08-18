'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminSupportTicketReplyBody,
  ListAdminCommissionsParams,
  ListAdminComplaintsParams,
  ListAdminJobsParams,
  ListAdminNotificationsParams,
  ListAdminOffersParams,
  ListAdminOrdersParams,
  ListAdminPaymentsParams,
  ListAdminProvidersParams,
  ListAdminReviewsParams,
  ListAdminSupportTicketsParams,
  ListAdminTransactionsParams,
  ListAdminUsersParams,
  ListAuditLogsParams,
  UpdateAdminComplaintBody,
  UpdateAdminReviewBody,
  UpdateAdminSettingBody,
  UpdateAdminSupportTicketBody,
} from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { UserStatus, VerificationStatus } from '@talpio/types';

import { apiClient } from '@/lib/api-client';

/** Filtre nesnelerini anahtar fabrikasının beklediği düz kayda daraltır. */
function keyParams(params: object): Record<string, unknown> {
  return params as Record<string, unknown>;
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: ({ signal }) => apiClient.admin.dashboard(signal),
    staleTime: 30_000,
  });
}

export function useAdminUsers(params: ListAdminUsersParams) {
  return useQuery({
    queryKey: queryKeys.admin.users(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listUsers(params, signal),
    // Sayfa değişiminde tablo boşalıp zıplamasın.
    placeholderData: (previous) => previous,
  });
}

export function useAdminProviders(params: ListAdminProvidersParams) {
  return useQuery({
    queryKey: queryKeys.admin.providers(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listProviders(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminJobs(params: ListAdminJobsParams) {
  return useQuery({
    queryKey: queryKeys.admin.jobs(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listJobs(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminOffers(params: ListAdminOffersParams) {
  return useQuery({
    queryKey: queryKeys.admin.offers(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listOffers(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminOrders(params: ListAdminOrdersParams) {
  return useQuery({
    queryKey: queryKeys.admin.orders(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listOrders(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminPayments(params: ListAdminPaymentsParams) {
  return useQuery({
    queryKey: queryKeys.admin.payments(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listPayments(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminTransactions(params: ListAdminTransactionsParams) {
  return useQuery({
    queryKey: queryKeys.admin.transactions(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listTransactions(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminCommissionRules(params: ListAdminCommissionsParams) {
  return useQuery({
    queryKey: queryKeys.admin.commissions(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listCommissionRules(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminNotifications(params: ListAdminNotificationsParams) {
  return useQuery({
    queryKey: queryKeys.admin.notifications(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listNotifications(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminSupportTickets(params: ListAdminSupportTicketsParams) {
  return useQuery({
    queryKey: queryKeys.admin.supportTickets(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listSupportTickets(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminSupportTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.supportTicket(id),
    queryFn: ({ signal }) => apiClient.admin.getSupportTicket(id, signal),
    enabled: id.length > 0,
  });
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: UpdateAdminSupportTicketBody }) =>
      apiClient.admin.updateSupportTicket(input.id, input.body),
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.admin.supportTicket(ticket.id), ticket);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
    },
  });
}

export function useReplySupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: AdminSupportTicketReplyBody }) =>
      apiClient.admin.replySupportTicket(input.id, input.body),
    onSuccess: (_message, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTicket(input.id) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
    },
  });
}

export function useAdminComplaints(params: ListAdminComplaintsParams) {
  return useQuery({
    queryKey: queryKeys.admin.complaints(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listComplaints(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: UpdateAdminComplaintBody }) =>
      apiClient.admin.updateComplaint(input.id, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
    },
  });
}

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listAuditLogs(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminReviews(params: ListAdminReviewsParams) {
  return useQuery({
    queryKey: queryKeys.admin.reviews(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listReviews(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateReviewModeration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: UpdateAdminReviewBody }) =>
      apiClient.admin.updateReview(input.id, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: ({ signal }) => apiClient.admin.listSettings(signal),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateAdminSettingBody) => apiClient.admin.updateSetting(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings() });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useAdminRoles() {
  return useQuery({
    queryKey: queryKeys.admin.roles(),
    queryFn: ({ signal }) => apiClient.admin.listRoles(signal),
    staleTime: 60_000,
  });
}

/**
 * Durum değişikliği listeyi ve denetim kayıtlarını etkiler; ikisi de
 * geçersizlenir, aksi halde panelde eski durum görünmeye devam ederdi.
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: UserStatus; reason?: string }) =>
      apiClient.admin.updateUserStatus(input.id, input.status, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
    },
  });
}

export function useRevokeUserSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.admin.revokeUserSessions(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useUpdateProviderVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: VerificationStatus; reason?: string }) =>
      apiClient.admin.updateProviderVerification(input.id, input.status, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
    },
  });
}
