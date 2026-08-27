import { Inject, Injectable, Logger, Optional, type OnModuleInit } from '@nestjs/common';
import { AiFeatureCode } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';
import { MetricsService } from '@infra/metrics/metrics.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AiCreditService } from '@modules/billing/ai-credit.service';

import {
  AI_PROVIDER,
  aiCompletionResultSchema,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
} from './ai-provider';

const SYSTEM_PROMPT_KEY = 'agent.system';
const SYSTEM_PROMPT_VERSION = 1;
const SYSTEM_PROMPT_CONTENT = [
  'Sen Talpio işletme asistanısın.',
  'Yalnızca allowlist tool çağrıları öner; finans ve program verisini kendin uydurma.',
  'Tool sonuçları gelmeden sipariş, ciro veya müşteri iddiasında bulunma.',
].join(' ');

const FALLBACK_MESSAGE =
  'Şu an yanıt üretemedim. Lütfen sorunuzu bugün / teklif / ödeme / ciro gibi net bir istekle tekrar deneyin.';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly credits: AiCreditService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSystemPromptSeed();
  }

  /** Prompt sürümü yoksa oluşturur; mevcut sürümün içeriği üzerine yazılmaz. */
  async ensureSystemPromptSeed(): Promise<void> {
    await this.prisma.aiPromptVersion.upsert({
      where: {
        key_version: { key: SYSTEM_PROMPT_KEY, version: SYSTEM_PROMPT_VERSION },
      },
      create: {
        key: SYSTEM_PROMPT_KEY,
        version: SYSTEM_PROMPT_VERSION,
        content: SYSTEM_PROMPT_CONTENT,
        metadata: { locale: 'tr' },
      },
      update: {},
    });
  }

  async getSystemPrompt(): Promise<string> {
    const row = await this.prisma.aiPromptVersion.findUnique({
      where: {
        key_version: { key: SYSTEM_PROMPT_KEY, version: SYSTEM_PROMPT_VERSION },
      },
    });
    return row?.content ?? SYSTEM_PROMPT_CONTENT;
  }

  /**
   * Timeout + exponential retry + Zod doğrulama + kullanım kaydı.
   *
   * `userId` varsa AI kredisi düşülür; başarısız tamamlamada iade edilir.
   * `userId` yoksa (sistem işleri) kredi atlanır — yalnızca AiUsageEvent telemetrisi.
   * Hata durumunda (kredi hataları hariç) fallback mesaj döner; Agent sohbeti kırılmaz.
   */
  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    this.metrics?.increment('ai_calls');
    const maxRetries = this.config.ai.maxRetries;
    const timeoutMs = this.config.ai.timeoutMs;
    let lastError: unknown;
    let debit: { transactionId: string; creditsCharged: number; usageRecordId: string } | null =
      null;

    if (request.userId) {
      const featureCode = (request.featureCode ?? AiFeatureCode.GENERIC_COMPLETE) as AiFeatureCode;
      const idempotencyKey =
        request.idempotencyKey ?? `ai-complete:${request.userId}:${featureCode}:${Date.now()}`;
      debit = await this.credits.reserveAndDebit({
        userId: request.userId,
        businessId: request.businessId,
        featureCode,
        idempotencyKey,
        metadata: {
          tenantId: request.tenantId,
          provider: this.provider.name,
        },
      });
    }

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const started = Date.now();
      try {
        const raw = await this.withTimeout(
          this.provider.complete({
            ...request,
            model: request.model ?? this.config.ai.defaultModel,
          }),
          timeoutMs,
        );
        const parsed = aiCompletionResultSchema.parse(raw);
        await this.recordUsage({
          tenantId: request.tenantId,
          operation: request.operation ?? 'complete',
          success: true,
          durationMs: Date.now() - started,
          promptTokens: parsed.promptTokens,
          completionTokens: parsed.completionTokens,
        });
        if (debit) {
          await this.credits.markUsageSuccess({
            usageRecordId: debit.usageRecordId,
            provider: parsed.provider,
            model: parsed.model,
            promptTokens: parsed.promptTokens,
            completionTokens: parsed.completionTokens,
            durationMs: Date.now() - started,
          });
        }
        return parsed;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          { err: error, attempt, provider: this.provider.name },
          'AI complete denemesi başarısız',
        );
        if (attempt < maxRetries) {
          await this.sleep(2 ** attempt * 200);
        }
      }
    }

    this.metrics?.increment('ai_failures');
    await this.recordUsage({
      tenantId: request.tenantId,
      operation: request.operation ?? 'complete',
      success: false,
      durationMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      errorCode: lastError instanceof Error ? lastError.name : 'AI_ERROR',
    });

    if (debit) {
      await this.credits.refund({
        usageRecordId: debit.usageRecordId,
        reason: lastError instanceof Error ? lastError.name : 'AI_ERROR',
      });
    }

    return {
      content: FALLBACK_MESSAGE,
      toolCalls: [],
      provider: this.provider.name,
      model: this.config.ai.defaultModel,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: 0,
    };
  }

  private async recordUsage(input: {
    tenantId?: string | null;
    operation: string;
    success: boolean;
    durationMs: number;
    promptTokens: number;
    completionTokens: number;
    errorCode?: string;
  }): Promise<void> {
    try {
      await this.prisma.aiUsageEvent.create({
        data: {
          tenantId: input.tenantId ?? null,
          provider: this.provider.name,
          operation: input.operation,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          costMicros: 0,
          success: input.success,
          durationMs: input.durationMs,
          errorCode: input.errorCode ?? null,
        },
      });
    } catch (error) {
      this.logger.error({ err: error }, 'AiUsageEvent yazılamadı');
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`AI zaman aşımı (${timeoutMs}ms)`));
      }, timeoutMs);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
