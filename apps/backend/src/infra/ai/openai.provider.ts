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

export function mapOpenAiChatCompletion(
  json: Record<string, unknown>,
  durationMs: number,
  fallbackModel: string,
): AiCompletionResult {
  const choice = Array.isArray(json.choices)
    ? (json.choices[0] as Record<string, unknown> | undefined)
    : undefined;
  const message = (choice?.message ?? {}) as Record<string, unknown>;
  const usage = (json.usage ?? {}) as Record<string, unknown>;
  const toolCalls: AiToolCallSuggestion[] = [];
  const rawTools = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  for (const raw of rawTools) {
    const call = raw as { function?: { name?: string; arguments?: string } };
    let args: Record<string, unknown> = {};
    try {
      args = call.function?.arguments
        ? (JSON.parse(call.function.arguments) as Record<string, unknown>)
        : {};
    } catch {
      args = {};
    }
    if (call.function?.name) {
      toolCalls.push({ name: call.function.name, arguments: args });
    }
  }

  return {
    content: typeof message.content === 'string' ? message.content : null,
    toolCalls,
    provider: 'openai',
    model: typeof json.model === 'string' ? json.model : fallbackModel,
    promptTokens: Number(usage.prompt_tokens ?? 0),
    completionTokens: Number(usage.completion_tokens ?? 0),
    durationMs,
  };
}

function toOpenAiMessages(messages: AiChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
  }));
}

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';

  constructor(private readonly config: AppConfigService) {}

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const apiKey = this.config.ai.openaiApiKey;
    if (!apiKey) {
      throw new AppException('INTERNAL_ERROR', {
        message: 'OpenAI API anahtarı yapılandırılmamış (AI_OPENAI_API_KEY).',
      });
    }

    const model = request.model ?? this.config.ai.defaultModel;
    const body: Record<string, unknown> = {
      model,
      temperature: request.temperature ?? 0.2,
      messages: toOpenAiMessages(request.messages),
    };
    if (request.tools?.length) {
      body.tools = request.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters ?? { type: 'object', properties: {} },
        },
      }));
    }

    const started = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.ai.timeoutMs),
    });

    const json = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const error = json.error as { message?: string } | undefined;
      throw new AppException('INTERNAL_ERROR', {
        message: error?.message ?? `OpenAI HTTP ${response.status}`,
      });
    }

    return mapOpenAiChatCompletion(json, Date.now() - started, model);
  }
}
