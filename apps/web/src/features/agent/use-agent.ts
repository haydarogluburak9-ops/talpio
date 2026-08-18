'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import type { AgentChatResponse, AgentThread } from '@talpio/types';

import { apiClient } from '@/lib/api';

export function useAgentThreads(enabled = true) {
  return useQuery({
    queryKey: queryKeys.agent.threads(),
    queryFn: ({ signal }) => apiClient.agent.listThreads(signal),
    enabled,
  });
}

export function useAgentThread(id: string | null) {
  return useQuery({
    queryKey: queryKeys.agent.thread(id ?? ''),
    queryFn: ({ signal }) => apiClient.agent.getThread(id!, signal),
    enabled: Boolean(id),
  });
}

export function usePendingAgentActions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.agent.pendingActions(),
    queryFn: ({ signal }) => apiClient.agent.listPendingActions(signal),
    enabled,
  });
}

export function useEnsureAgentThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AgentThread> => {
      const existing = await apiClient.agent.listThreads();
      if (existing[0]) return existing[0];
      return apiClient.agent.createThread({ title: 'Asistan' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.threads() });
    },
  });
}

export function usePostAgentMessage(threadId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string): Promise<AgentChatResponse> => {
      if (!threadId) throw new Error('thread_required');
      return apiClient.agent.postMessage(threadId, { content });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.agent.thread(data.thread.id), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.pendingActions() });
    },
  });
}

export function useApproveAgentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.agent.approveAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.all() });
    },
  });
}

export function useRejectAgentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.agent.rejectAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agent.all() });
    },
  });
}
