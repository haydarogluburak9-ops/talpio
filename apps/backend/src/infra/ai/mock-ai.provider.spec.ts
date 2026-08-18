import { AGENT_TOOL_NAMES } from '@talpio/types';

import { AiChatRole } from './ai-provider';
import { MockAiProvider } from './mock-ai.provider';

describe('MockAiProvider', () => {
  const provider = new MockAiProvider();

  it('bugün anahtar kelimesinde getTodaySchedule önerir', async () => {
    const result = await provider.complete({
      messages: [{ role: AiChatRole.USER, content: 'Bugün ne yapacağım?' }],
    });

    expect(result.toolCalls.map((call) => call.name)).toContain(
      AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE,
    );
    expect(result.content).toBeNull();
  });

  it('ciro için getMonthlyRevenueSummary önerir; tutar uydurmaz', async () => {
    const result = await provider.complete({
      messages: [{ role: AiChatRole.USER, content: 'Bu ay ciro ne kadar?' }],
    });

    expect(result.toolCalls).toEqual([
      { name: AGENT_TOOL_NAMES.GET_MONTHLY_REVENUE_SUMMARY, arguments: {} },
    ]);
    expect(result.content).toBeNull();
    expect(result.toolCalls[0]?.arguments).toEqual({});
  });

  it('hatırlatma için createReminderDraft önerir', async () => {
    const result = await provider.complete({
      messages: [{ role: AiChatRole.USER, content: 'Yarın keşif için hatırlatma kur' }],
    });

    expect(result.toolCalls.some((call) => call.name === AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT)).toBe(
      true,
    );
  });
});
