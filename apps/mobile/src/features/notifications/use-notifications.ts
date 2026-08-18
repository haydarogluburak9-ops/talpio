import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListNotificationsParams } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';

import { apiClient } from '@/lib/api';
import { useSession } from '@/features/auth/session-provider';

export function useNotifications(params: ListNotificationsParams = {}) {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.notifications.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.notifications.list(params, signal),
    enabled: status === 'authenticated',
    placeholderData: (previous) => previous,
  });
}

export function useUnreadCount() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: ({ signal }) => apiClient.notifications.unreadCount(signal),
    enabled: status === 'authenticated',
    refetchInterval: 60_000,
    select: (data) => data.unreadCount,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.notifications.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.notifications.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}
