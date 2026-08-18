import { Injectable } from '@nestjs/common';
import { AGENT_TOOL_NAMES } from '@talpio/types';

import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
  AiToolCallSuggestion,
} from './ai-provider';

/**
 * Anahtar kelime → tool adı eşlemesi.
 *
 * Gerçek sipariş/ciro verisi uydurulmaz; yalnızca hangi tool'un çağrılacağını önerir.
 * Finans ve program yanıtları uygulama servislerinden gelir.
 */
const KEYWORD_TOOLS: Array<{ patterns: RegExp[]; tool: AiToolCallSuggestion }> = [
  {
    patterns: [/yarın/i, /tomorrow/i],
    tool: { name: AGENT_TOOL_NAMES.GET_TOMORROW_SCHEDULE, arguments: {} },
  },
  {
    patterns: [/bugün/i, /today/i, /ne yapaca/i, /ajanda/i, /program/i],
    tool: { name: AGENT_TOOL_NAMES.GET_TODAY_SCHEDULE, arguments: {} },
  },
  {
    patterns: [/teklif/i, /offer/i],
    tool: { name: AGENT_TOOL_NAMES.GET_PENDING_OFFERS, arguments: {} },
  },
  {
    patterns: [/ödeme/i, /tahsilat/i, /payment/i, /unpaid/i],
    tool: { name: AGENT_TOOL_NAMES.GET_PENDING_PAYMENTS, arguments: {} },
  },
  {
    patterns: [/aktif iş/i, /devam eden/i, /active order/i],
    tool: { name: AGENT_TOOL_NAMES.GET_ACTIVE_ORDERS, arguments: {} },
  },
  {
    patterns: [/bildirim/i, /notification/i],
    tool: { name: AGENT_TOOL_NAMES.GET_RECENT_NOTIFICATIONS, arguments: {} },
  },
  {
    patterns: [/ciro/i, /kazanç/i, /gelir/i, /revenue/i, /earnings/i],
    tool: { name: AGENT_TOOL_NAMES.GET_MONTHLY_REVENUE_SUMMARY, arguments: {} },
  },
  {
    patterns: [/hatırlat/i, /reminder/i],
    tool: {
      name: AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT,
      arguments: {
        title: 'Hatırlatma',
        body: null,
        dueAt: null,
      },
    },
  },
  {
    patterns: [/ali/i],
    tool: {
      name: AGENT_TOOL_NAMES.SEARCH_CUSTOMER_OR_ORDER,
      arguments: { query: 'Ali' },
    },
  },
];

@Injectable()
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const started = Date.now();
    const lastUser = [...request.messages].reverse().find((message) => message.role === 'user');
    const text = lastUser?.content ?? '';
    const draft = draftJsonForOperation(request.operation, text);
    if (draft) {
      return {
        content: draft,
        toolCalls: [],
        provider: this.name,
        model: 'mock-keyword-v1',
        promptTokens: Math.ceil(text.length / 4),
        completionTokens: Math.ceil(draft.length / 4),
        durationMs: Date.now() - started,
      };
    }

    const toolCalls = this.suggestTools(text);

    return {
      content:
        toolCalls.length > 0
          ? null
          : 'Size bugünkü işler, teklifler, ödemeler veya ciro hakkında yardımcı olabilirim.',
      toolCalls,
      provider: this.name,
      model: 'mock-keyword-v1',
      promptTokens: Math.ceil(text.length / 4),
      completionTokens: toolCalls.length,
      durationMs: Date.now() - started,
    };
  }

  private suggestTools(text: string): AiToolCallSuggestion[] {
    const matched: AiToolCallSuggestion[] = [];
    const seen = new Set<string>();

    for (const entry of KEYWORD_TOOLS) {
      if (!entry.patterns.some((pattern) => pattern.test(text))) continue;
      if (seen.has(entry.tool.name)) continue;
      seen.add(entry.tool.name);

      if (entry.tool.name === AGENT_TOOL_NAMES.CREATE_REMINDER_DRAFT) {
        const titleMatch = text.match(/hatırlat(?:ma)?[:\s]+(.+)/i);
        matched.push({
          name: entry.tool.name,
          arguments: {
            title: titleMatch?.[1]?.trim() || 'Hatırlatma',
            body: null,
            dueAt: null,
          },
        });
        continue;
      }

      if (entry.tool.name === AGENT_TOOL_NAMES.SEARCH_CUSTOMER_OR_ORDER) {
        const nameMatch = text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?)\b/);
        matched.push({
          name: entry.tool.name,
          arguments: { query: nameMatch?.[1] ?? 'Ali' },
        });
        continue;
      }

      matched.push(entry.tool);
    }

    return matched;
  }
}

function draftJsonForOperation(operation: string | undefined, text: string): string | null {
  const snippet = text.slice(0, 80).replace(/\s+/g, ' ').trim() || 'Taslak';
  if (operation === 'request_draft') {
    return JSON.stringify({
      title: snippet,
      description: `${snippet}. Lütfen miktar, teslim yeri ve tarih ekleyin.`,
      categorySuggestion: null,
      missingQuestions: ['Miktar nedir?', 'Teslim tarihi nedir?'],
      summary: snippet,
    });
  }
  if (operation === 'offer_draft') {
    return JSON.stringify({
      headline: 'Teklif taslağı',
      body: snippet,
      deliveryNote: null,
    });
  }
  if (operation === 'social_draft') {
    return JSON.stringify({
      headline: snippet.slice(0, 60),
      body: snippet,
      hashtags: ['talpio'],
      audienceSuggestion: 'FOLLOWERS',
      durationDays: 7,
    });
  }
  if (operation === 'sales_coach') {
    return 'Verilen dönüşüm ve teklif sayıları üzerinden özet: rakamları değiştirmedim.';
  }
  return null;
}
