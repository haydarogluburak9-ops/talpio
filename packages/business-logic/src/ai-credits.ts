import { AiFeatureCode } from '@talpio/types';

/** Özellik başına varsayılan kredi maliyeti (seed / AiFeature.baseCostCredits ile uyumlu). */
export const DEFAULT_CREDIT_COSTS: Record<AiFeatureCode, number> = {
  [AiFeatureCode.AGENT_CHAT]: 2,
  [AiFeatureCode.REQUEST_DRAFT]: 5,
  [AiFeatureCode.OFFER_DRAFT]: 5,
  [AiFeatureCode.IMAGE_ANALYSIS]: 8,
  [AiFeatureCode.AUDIO_TRANSCRIBE]: 10,
  [AiFeatureCode.DOC_ANALYSIS]: 12,
  [AiFeatureCode.GENERIC_COMPLETE]: 3,
  [AiFeatureCode.SOCIAL_DRAFT]: 5,
  [AiFeatureCode.SALES_COACH]: 4,
};

export interface EstimateCreditsInput {
  feature: AiFeatureCode;
  promptTokens?: number;
  durationSec?: number;
  /** Seed/DB override; yoksa DEFAULT_CREDIT_COSTS kullanılır. */
  baseCostCredits?: number;
}

/**
 * Tahmini kredi maliyeti. MVP: taban maliyet + isteğe bağlı süre/token ekleri.
 * Ses için her 60 sn ek 1 kredi; çok uzun promptlarda her 2k token +1.
 */
export function estimateCredits(input: EstimateCreditsInput): number {
  const base = input.baseCostCredits ?? DEFAULT_CREDIT_COSTS[input.feature] ?? 1;
  let total = base;

  if (input.feature === AiFeatureCode.AUDIO_TRANSCRIBE && input.durationSec != null) {
    const extraMinutes = Math.max(0, Math.ceil(input.durationSec / 60) - 1);
    total += extraMinutes;
  }

  if (input.promptTokens != null && input.promptTokens > 2_000) {
    total += Math.floor((input.promptTokens - 2_000) / 2_000);
  }

  return Math.max(1, total);
}
