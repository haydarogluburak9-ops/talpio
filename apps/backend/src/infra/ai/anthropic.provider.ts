import { Injectable } from '@nestjs/common';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';

import type {
  AiChatMessage,
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
  AiToolCallSuggestion,
} from './ai-provider';

export function mapAnthropicMessage(
  json: Record<string, unknown>,
  durationMs: number,
  fallbackModel: string,
): AiCompletionResult {
  const content = Array.isArray(json.content) ? json.content : [];
  const texts: string[] = [];
  const toolCalls: AiToolCallSuggestion[] = [];
  for (const block of content) {
    const item = block as {
      type?: string;
      text?: string;
      name?: string;
      input?: Record<string, unknown>;
    };
    if (item.type === 'text' && item.text) texts.push(item.text);
    if (item.type === 'tool_use' && item.name) {
      toolCalls.push({ name: item.name, arguments: item.input ?? {} });
    }
  }
  const usage = (json.usage ?? {}) as Record<string, unknown>;
  return {
    content: texts.length ? texts.join('\n') : null,
    toolCalls,
    provider: 'anthropic',
    model: typeof json.model === 'string' ? json.model : fallbackModel,
    promptTokens: Number(usage.input_tokens ?? 0),
    completionTokens: Number(usage.output_tokens ?? 0),
    durationMs,
  };
}

function splitSystem(messages: AiChatMessage[]) {
  const system = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n');
  const rest = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));
  return { system, rest };
}

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';

  constructor(private readonly config: AppConfigService) {}

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const apiKey = this.config.ai.anthropicApiKey;
    if (!apiKey) {
      throw new AppException('INTERNAL_ERROR', {
        message: 'Anthropic API anahtarı yapılandırılmamış (AI_ANTHROPIC_API_KEY).',
      });
    }

    const model = request.model ?? 'claude-3-5-haiku-latest';
    const { system, rest } = splitSystem(request.messages);
    const body: Record<string, unknown> = {
      model,
      max_tokens: 1024,
      temperature: request.temperature ?? 0.2,
      messages: rest,
      ...(system ? { system } : {}),
    };
    if (request.tools?.length) {
      body.tools = request.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters ?? { type: 'object', properties: {} },
      }));
    }

    const started = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.ai.timeoutMs),
    });

    const json = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const error = json.error as { message?: string } | undefined;
      throw new AppException('INTERNAL_ERROR', {
        message: error?.message ?? `Anthropic HTTP ${response.status}`,
      });
    }

    return mapAnthropicMessage(json, Date.now() - started, model);
  }
}
