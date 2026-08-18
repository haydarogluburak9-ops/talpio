import { AGENT_TOOL_NAMES } from '@talpio/types';

import type { AiService } from '@infra/ai/ai.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { AgentService } from './agent.service';
import type { AgentToolsService } from './agent-tools.service';

const TENANT = 'profile-1';
const USER: AuthenticatedUser = {
  id: 'user-1',
  role: 'PROVIDER',
  sessionId: 's1',
};

describe('AgentService chat', () => {
  it('mock tool + boş servis sonucu → Kayıt bulunamadı (halüsinasyon yok)', async () => {
    const prisma = {
      providerProfile: {
        findFirst: jest.fn().mockResolvedValue({ id: TENANT }),
      },
      agentThread: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'thread-1',
          tenantId: TENANT,
          userId: USER.id,
          title: 'Asistan',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      agentMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'user-msg-1',
          threadId: 'thread-1',
          role: 'USER',
          content: 'Bugün ne yapacağım?',
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'm1',
            threadId: 'thread-1',
            role: 'USER',
            content: 'Bugün ne yapacağım?',
            metadata: null,
            createdAt: new Date(),
          },
          {
            id: 'm2',
            threadId: 'thread-1',
            role: 'ASSISTANT',
            content: 'Kayıt bulunamadı.',
            metadata: null,
            createdAt: new Date(),
          },
        ]),
      },
      agentActionProposal: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const ai = {
      getSystemPrompt: jest.fn().mockResolvedValue('system'),
      complete: jest.fn().mockResolvedValue({
        content: null,
        toolCalls: [{ name: AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE, arguments: {} }],
        provider: 'mock',
        model: 'mock',
        promptTokens: 1,
        completionTokens: 1,
        durationMs: 1,
      }),
    };

    const tools = {
      execute: jest.fn().mockResolvedValue({
        summary: 'Kayıt bulunamadı.',
        data: [],
        requiresApproval: false,
      }),
    };

    const audit = { record: jest.fn() };

    const service = new AgentService(
      prisma as unknown as PrismaService,
      ai as unknown as AiService,
      tools as unknown as AgentToolsService,
      audit as unknown as AuditLogService,
    );

    const response = await service.postMessage(USER, 'thread-1', {
      content: 'Bugün ne yapacağım?',
    });

    expect(tools.execute).toHaveBeenCalledWith(
      AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE,
      {},
      expect.objectContaining({ tenantId: TENANT }),
    );
    expect(response.messages.at(-1)?.content).toBe('Kayıt bulunamadı.');
    expect(JSON.stringify(response)).not.toMatch(/3 iş|sahte|uydurma/i);
  });
});
