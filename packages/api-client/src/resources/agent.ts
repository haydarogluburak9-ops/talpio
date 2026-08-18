import { API_ROUTES } from '@talpio/config';
import type {
  AgentActionProposal,
  AgentChatResponse,
  AgentThread,
} from '@talpio/types';

import type { HttpClient } from '../http-client';

export interface CreateAgentThreadBody {
  title?: string;
}

export interface PostAgentMessageBody {
  content: string;
}

export function createAgentResource(http: HttpClient) {
  return {
    createThread(body: CreateAgentThreadBody = {}): Promise<AgentThread> {
      return http.post<AgentThread>(API_ROUTES.agent.threads, body);
    },

    listThreads(signal?: AbortSignal): Promise<AgentThread[]> {
      return http.get<AgentThread[]>(API_ROUTES.agent.threads, {
        ...(signal ? { signal } : {}),
      });
    },

    getThread(id: string, signal?: AbortSignal): Promise<AgentChatResponse> {
      return http.get<AgentChatResponse>(API_ROUTES.agent.threadById(id), {
        ...(signal ? { signal } : {}),
      });
    },

    postMessage(id: string, body: PostAgentMessageBody): Promise<AgentChatResponse> {
      return http.post<AgentChatResponse>(API_ROUTES.agent.messages(id), body);
    },

    listPendingActions(signal?: AbortSignal): Promise<AgentActionProposal[]> {
      return http.get<AgentActionProposal[]>(API_ROUTES.agent.pendingActions, {
        ...(signal ? { signal } : {}),
      });
    },

    approveAction(id: string): Promise<AgentActionProposal> {
      return http.post<AgentActionProposal>(API_ROUTES.agent.approveAction(id));
    },

    rejectAction(id: string): Promise<AgentActionProposal> {
      return http.post<AgentActionProposal>(API_ROUTES.agent.rejectAction(id));
    },
  };
}

export type AgentResource = ReturnType<typeof createAgentResource>;
