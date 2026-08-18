import { z } from 'zod';

/** Nest DI belirteci; etkin AI sürücüsü ortam değişkeninden seçilir. */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

export const AiChatRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const;

export type AiChatRole = (typeof AiChatRole)[keyof typeof AiChatRole];

export interface AiChatMessage {
  role: AiChatRole;
  content: string;
  name?: string;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  /** JSON Schema benzeri parametre açıklaması; sağlayıcıya iletilir. */
  parameters?: Record<string, unknown>;
}

export interface AiToolCallSuggestion {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiCompletionRequest {
  messages: AiChatMessage[];
  tools?: AiToolDefinition[];
  temperature?: number;
  model?: string;
  /** Kullanım telemetrisi için; yoksa anonim yazılır. */
  tenantId?: string | null;
  operation?: string;
  /**
   * Faturalama: doluysa AiCreditService ile debit yapılır.
   * Sistem işleri / userId yoksa yalnızca AiUsageEvent telemetrisi yazılır (kredi düşülmez).
   */
  userId?: string | null;
  businessId?: string | null;
  featureCode?: string;
  idempotencyKey?: string;
}

export interface AiCompletionResult {
  content: string | null;
  toolCalls: AiToolCallSuggestion[];
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

export const aiToolCallSuggestionSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

export const aiCompletionResultSchema = z.object({
  content: z.string().nullable(),
  toolCalls: z.array(aiToolCallSuggestionSchema),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});

/**
 * AI sağlayıcısı sözleşmesi.
 *
 * Gerçek bir sağlayıcı (OpenAI, Anthropic) eklendiğinde yalnızca bu arayüzü
 * uygulayan adaptör yazılır; Agent modülü değişmez.
 */
export interface AiProvider {
  readonly name: string;

  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}
