import { FraudFlagReason } from '@talpio/types';

/** Saatlik pencere; bayrak eşiği bunun üzerinde açılır, hesap kilitlenmez. */
export const FRAUD_VOLUME_WINDOW_MS = 60 * 60 * 1000;

export const FRAUD_VOLUME_THRESHOLDS: Record<
  Extract<FraudFlagReason, 'MANY_REQUESTS' | 'MANY_OFFERS' | 'SPAM_MESSAGES'>,
  number
> = {
  MANY_REQUESTS: 20,
  MANY_OFFERS: 40,
  SPAM_MESSAGES: 60,
};

export function shouldFlagVolume(countInWindow: number, threshold: number): boolean {
  return countInWindow >= threshold;
}
