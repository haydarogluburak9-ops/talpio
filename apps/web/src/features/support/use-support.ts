'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateComplaintBody,
  CreateSupportTicketBody,
  ListComplaintsParams,
  ListSupportTicketsParams,
  SupportTicketReplyBody,
} from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { SupportTicketDetail } from '@talpio/types';

import { apiClient } from '@/lib/api';

function keyParams(params: object): Record<string, unknown> {
  return params as Record<string, unknown>;
}

export function useSupportTickets(params: ListSupportTicketsParams = {}) {
  return useQuery({
    queryKey: queryKeys.support.tickets(keyParams(params)),
    queryFn: ({ signal }) => apiClient.support.listTickets(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useSupportTicket(id: string) {
  return useQuery<SupportTicketDetail>({
    queryKey: queryKeys.support.ticket(id),
    queryFn: ({ signal }) => apiClient.support.getTicket(id, signal),
    enabled: id.length > 0,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSupportTicketBody) => apiClient.support.createTicket(body),
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.support.ticket(ticket.id), ticket);
      void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}

export function useReplySupportTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SupportTicketReplyBody) => apiClient.support.reply(ticketId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.support.ticket(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}

export function useCloseSupportTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.support.closeTicket(ticketId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.support.ticket(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}

export function useComplaints(params: ListComplaintsParams = {}) {
  return useQuery({
    queryKey: queryKeys.support.complaints(keyParams(params)),
    queryFn: ({ signal }) => apiClient.support.listComplaints(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateComplaintBody) => apiClient.support.createComplaint(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['support', 'complaints'] });
    },
  });
}
