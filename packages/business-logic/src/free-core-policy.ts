/**
 * Ücretsiz çekirdek yetenekler — lead duvarı / teklif ücreti yok.
 * Sosyal follow/post Faz 2'de gelir; burada yalnızca yer tutucu string'ler.
 */
export const FREE_CORE_CAPABILITIES = [
  'account',
  'request',
  'offer',
  'message',
  'follow',
] as const;

export type FreeCoreCapability = (typeof FREE_CORE_CAPABILITIES)[number];

/** Lead satın alma / keşif paywall'ı kapalı kalır. */
export function isLeadPaywallEnabled(): boolean {
  return false;
}

export function isFreeCoreCapability(value: string): value is FreeCoreCapability {
  return (FREE_CORE_CAPABILITIES as readonly string[]).includes(value);
}
