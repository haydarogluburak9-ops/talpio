export const MIN_INTERESTS = 3;

export function needsInterestOnboarding(followCount: number): boolean {
  return followCount < MIN_INTERESTS;
}

export const INTEREST_ONBOARDING_PATH = '/ilgi-alanlari';
