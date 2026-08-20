import type { Metadata } from 'next';

import { InterestOnboardingPage } from '@/features/auth/interest-onboarding-page';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('auth.interestsTitle', { descriptionKey: 'auth.interestsHint' });
}

export default async function InterestOnboardingRoute() {
  await applyRequestLocale();
  return <InterestOnboardingPage />;
}
