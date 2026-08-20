'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { useCategoryFollows } from '@/features/social/use-social';
import { INTEREST_ONBOARDING_PATH, needsInterestOnboarding } from '@/lib/interest-onboarding';

/** Uygulama kabuğunda ilgi alanı eksikse onboarding sayfasına yönlendirir. */
export function InterestOnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const follows = useCategoryFollows(session.data != null);

  useEffect(() => {
    if (pathname === INTEREST_ONBOARDING_PATH) return;
    if (!session.data || !follows.isSuccess) return;
    if (needsInterestOnboarding(follows.data.length)) {
      router.replace(INTEREST_ONBOARDING_PATH);
    }
  }, [pathname, session.data, follows.isSuccess, follows.data, router]);

  return children;
}
