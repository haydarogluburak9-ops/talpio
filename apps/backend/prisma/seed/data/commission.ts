import { COMMISSION } from '@ustapilot/config';

export interface CommissionRuleSeed {
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'HYBRID';
  rateBps: number;
  fixedMinor: number;
  premiumRateBps: number | null;
  priority: number;
}

/**
 * Varsayılan komisyon kuralı. Kategori veya şehre özel kurallar admin
 * panelinden eklenir ve daha yüksek özgüllükleri sayesinde bunun önüne geçer.
 */
export const COMMISSION_RULES: CommissionRuleSeed[] = [
  {
    name: 'Genel varsayılan komisyon',
    type: 'PERCENTAGE',
    rateBps: COMMISSION.defaultRateBps,
    fixedMinor: COMMISSION.defaultFixedMinor,
    premiumRateBps: COMMISSION.premiumRateBps,
    priority: 0,
  },
];
