import { AGENT_TOOL_NAMES } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { PrismaService } from '@infra/prisma/prisma.service';

import { AgentToolsService } from './agent-tools.service';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const USER_A = 'user-a';
const THREAD = 'thread-1';

function createService(prisma: Record<string, unknown>) {
  return new AgentToolsService(prisma as unknown as PrismaService);
}

describe('AgentToolsService', () => {
  it('allowlist dışı tool adını reddeder', async () => {
    const service = createService({
      agentToolInvocation: { create: jest.fn() },
    });

    await expect(
      service.execute(
        'dropAllTables',
        {},
        { tenantId: TENANT_A, userId: USER_A, threadId: THREAD },
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('yanlış tenant için bugünkü programda kayıt döndürmez', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const log = jest.fn().mockResolvedValue({});
    const service = createService({
      order: { findMany },
      agentToolInvocation: { create: log },
    });

    const result = await service.execute(
      AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE,
      {},
      { tenantId: TENANT_A, userId: USER_A, threadId: THREAD },
    );

    expect(result.summary).toBe('Kayıt bulunamadı.');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ providerProfileId: TENANT_A }),
      }),
    );
    expect(findMany.mock.calls[0]?.[0]?.where?.providerProfileId).not.toBe(TENANT_B);
  });

  it('boş sonuçta halüsinasyon yok: Kayıt bulunamadı', async () => {
    const service = createService({
      offer: { findMany: jest.fn().mockResolvedValue([]) },
      agentToolInvocation: { create: jest.fn().mockResolvedValue({}) },
    });

    const result = await service.execute(
      AGENT_TOOL_NAMES.GET_PENDING_OFFERS,
      {},
      { tenantId: TENANT_A, userId: USER_A, threadId: THREAD },
    );

    expect(result.summary).toBe('Kayıt bulunamadı.');
    expect(result.data).toEqual([]);
  });

  it('createReminderDraft Reminder yazmaz; onay önerisi üretir', async () => {
    const reminderCreate = jest.fn();
    const proposalCreate = jest.fn().mockResolvedValue({
      id: 'proposal-1',
      summary: 'Hatırlatma: Test',
    });

    const service = createService({
      reminder: { create: reminderCreate },
      agentActionProposal: { create: proposalCreate },
      agentToolInvocation: { create: jest.fn().mockResolvedValue({}) },
    });

    const result = await service.execute(
      AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT,
      { title: 'Test', dueAt: '2026-08-06T10:00:00.000Z' },
      { tenantId: TENANT_A, userId: USER_A, threadId: THREAD },
    );

    expect(result.requiresApproval).toBe(true);
    expect(result.proposalId).toBe('proposal-1');
    expect(reminderCreate).not.toHaveBeenCalled();
    expect(proposalCreate).toHaveBeenCalled();
  });
});
