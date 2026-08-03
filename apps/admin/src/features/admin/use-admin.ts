'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListAdminJobsParams,
  ListAdminOffersParams,
  ListAdminOrdersParams,
  ListAdminProvidersParams,
  ListAdminUsersParams,
  ListAuditLogsParams,
} from '@ustapilot/api-client';
import { queryKeys } from '@ustapilot/config';
import type { UserStatus, VerificationStatus } from '@ustapilot/types';

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

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(keyParams(params)),
    queryFn: ({ signal }) => apiClient.admin.listAuditLogs(params, signal),
    placeholderData: (previous) => previous,
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
