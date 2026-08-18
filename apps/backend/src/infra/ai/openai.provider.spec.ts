import { mapOpenAiChatCompletion } from './openai.provider';

describe('mapOpenAiChatCompletion', () => {
  it('tool çağrılarını JSON argümanlarıyla döner', () => {
    const result = mapOpenAiChatCompletion(
      {
        model: 'gpt-4o-mini',
        usage: { prompt_tokens: 11, completion_tokens: 4 },
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  function: {
                    name: 'getTodaySchedule',
                    arguments: '{"x":1}',
                  },
                },
              ],
            },
          },
        ],
      },
      42,
      'fallback',
    );

    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.toolCalls).toEqual([{ name: 'getTodaySchedule', arguments: { x: 1 } }]);
    expect(result.promptTokens).toBe(11);
    expect(result.durationMs).toBe(42);
  });
});
