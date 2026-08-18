import { mapAnthropicMessage } from './anthropic.provider';

describe('mapAnthropicMessage', () => {
  it('text + tool_use bloklarını ayırır', () => {
    const result = mapAnthropicMessage(
      {
        model: 'claude-3-5-haiku-latest',
        usage: { input_tokens: 8, output_tokens: 3 },
        content: [
          { type: 'text', text: 'Merhaba' },
          { type: 'tool_use', name: 'getPendingOffers', input: { q: 'x' } },
        ],
      },
      9,
      'fallback',
    );

    expect(result.content).toBe('Merhaba');
    expect(result.toolCalls).toEqual([{ name: 'getPendingOffers', arguments: { q: 'x' } }]);
    expect(result.provider).toBe('anthropic');
  });
});
