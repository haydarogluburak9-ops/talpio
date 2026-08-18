/**
 * Accept sonrası marketplace komisyonu (keşif / lead paywall değil).
 * Birincil gelir modeli: premium AI kredileri (`MONETIZATION.primaryRevenue`).
 */
import { COMMISSION } from '@talpio/config';
import { CommissionType } from '@talpio/types';
import type { CommissionBreakdown, CommissionRule } from '@talpio/types';

export interface CommissionContext {
  grossMinor: number;
  currency: string;
  isPremiumProvider?: boolean;
  categoryId?: string | null;
  cityId?: string | null;
  at?: Date;
}

/**
 * Bağlama uyan kuralları önceliğe göre sıralar ve en uygun olanı seçer.
 * Kategori ve şehir eşleşmesi daha yüksek önceliklidir; eşitlik durumunda
 * `priority` alanı belirler.
 */
export function selectCommissionRule(
  rules: readonly CommissionRule[],
  context: CommissionContext,
): CommissionRule | null {
  const at = context.at ?? new Date();

  const applicable = rules.filter((rule) => {
    if (!rule.isActive) return false;
    if (rule.validFrom && new Date(rule.validFrom) > at) return false;
    if (rule.validUntil && new Date(rule.validUntil) < at) return false;
    if (rule.categoryId && rule.categoryId !== context.categoryId) return false;
    if (rule.cityId && rule.cityId !== context.cityId) return false;
    if (rule.minAmountMinor != null && context.grossMinor < rule.minAmountMinor) return false;
    if (rule.maxAmountMinor != null && context.grossMinor > rule.maxAmountMinor) return false;
    return true;
  });

  if (applicable.length === 0) return null;

  const specificity = (rule: CommissionRule): number =>
    (rule.categoryId ? 2 : 0) + (rule.cityId ? 1 : 0);

  return applicable.reduce((best, candidate) => {
    const bestScore = specificity(best);
    const candidateScore = specificity(candidate);
    if (candidateScore !== bestScore) return candidateScore > bestScore ? candidate : best;
    return candidate.priority > best.priority ? candidate : best;
  });
}

/**
 * Komisyonu hesaplar. Tüm tutarlar kuruş cinsinden tam sayıdır; yuvarlama
 * yalnızca yüzdelik kısımda bir kez yapılır ve net tutar daima
 * `brüt - komisyon` olarak türetilir; böylece toplamlar tutarsız kalmaz.
 */
export function calculateCommission(
  context: CommissionContext,
  rule?: CommissionRule | null,
): CommissionBreakdown {
  if (!Number.isInteger(context.grossMinor) || context.grossMinor < 0) {
    throw new RangeError('Brüt tutar kuruş cinsinden negatif olmayan tam sayı olmalıdır');
  }

  const usePremium = context.isPremiumProvider === true && rule?.premiumRateBps != null;

  let rateBps: number = COMMISSION.defaultRateBps;
  let fixedMinor: number = COMMISSION.defaultFixedMinor;

  if (rule) {
    const baseRate = usePremium ? (rule.premiumRateBps ?? rule.rateBps) : rule.rateBps;
    switch (rule.type) {
      case CommissionType.PERCENTAGE:
        rateBps = baseRate;
        fixedMinor = 0;
        break;
      case CommissionType.FIXED:
        rateBps = 0;
        fixedMinor = rule.fixedMinor;
        break;
      case CommissionType.HYBRID:
        rateBps = baseRate;
        fixedMinor = rule.fixedMinor;
        break;
    }
  } else if (context.isPremiumProvider === true) {
    rateBps = COMMISSION.premiumRateBps;
  }

  rateBps = Math.min(Math.max(rateBps, 0), COMMISSION.maxRateBps);

  const percentagePart = Math.round((context.grossMinor * rateBps) / 10_000);
  const commissionMinor = Math.min(percentagePart + fixedMinor, context.grossMinor);

  return {
    grossMinor: context.grossMinor,
    commissionMinor,
    netPayoutMinor: context.grossMinor - commissionMinor,
    currency: context.currency,
    appliedRuleId: rule?.id ?? null,
    appliedRateBps: rateBps,
    appliedFixedMinor: fixedMinor,
  };
}

/** Baz puanı okunabilir yüzdeye çevirir. 1250 → 12.5 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}
