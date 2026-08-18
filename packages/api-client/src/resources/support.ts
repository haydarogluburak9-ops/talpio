import { API_ROUTES } from '@talpio/config';
import type {
  Complaint,
  ComplaintStatus,
  ComplaintSubjectType,
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketStatus,
} from '@talpio/types';

import type { HttpClient, Paginated } from '../http-client';

export interface ListSupportTicketsParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: SupportTicketStatus[];
  sort?: string;
}

export interface CreateSupportTicketBody {
  subject: string;
  body: string;
  orderId?: string;
  attachmentFileIds?: string[];
}

export interface SupportTicketReplyBody {
  body: string;
  attachmentFileIds?: string[];
}

export interface ListComplaintsParams {
  page?: number;
  limit?: number;
  status?: ComplaintStatus[];
  sort?: string;
}

export interface CreateComplaintBody {
  subjectType: ComplaintSubjectType;
  subjectId: string;
  reason: string;
  description?: string;
}

export function createSupportResource(http: HttpClient) {
  return {
    createTicket(body: CreateSupportTicketBody): Promise<SupportTicketDetail> {
      return http.post<SupportTicketDetail>(API_ROUTES.support.tickets, body);
    },

    listTickets(
      params: ListSupportTicketsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SupportTicket>> {
      return http.paginated<SupportTicket>(API_ROUTES.support.tickets, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    getTicket(id: string, signal?: AbortSignal): Promise<SupportTicketDetail> {
      return http.get<SupportTicketDetail>(API_ROUTES.support.ticketById(id), {
        ...(signal ? { signal } : {}),
      });
    },

    reply(id: string, body: SupportTicketReplyBody): Promise<SupportMessage> {
      return http.post<SupportMessage>(API_ROUTES.support.ticketMessages(id), body);
    },

    closeTicket(id: string): Promise<SupportTicket> {
      return http.post<SupportTicket>(API_ROUTES.support.ticketClose(id));
    },

    createComplaint(body: CreateComplaintBody): Promise<Complaint> {
      return http.post<Complaint>(API_ROUTES.support.complaints, body);
    },

    listComplaints(
      params: ListComplaintsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Complaint>> {
      return http.paginated<Complaint>(API_ROUTES.support.complaints, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type SupportResource = ReturnType<typeof createSupportResource>;
