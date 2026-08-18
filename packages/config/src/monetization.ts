/**
 * Gelir modeli: premium AI kredileri birincil; lead satışı / teklif duvarı yok.
 * Accept sonrası marketplace komisyonu keşif duvarı değildir.
 */
export const MONETIZATION = {
  primaryRevenue: 'premium_ai_credits' as const,
  leadPurchaseEnabled: false,
  offerPaywallEnabled: false,
  /** Post-accept marketplace fee; not a discovery wall */
  commissionOnOrderEnabled: true,
  freeTrialCreditsPerMonth: 50,
  premiumCreditsPerMonth: 500,
  premiumPlusCreditsPerMonth: 2000,
  businessCreditsPerMonth: 5000,
} as const;
