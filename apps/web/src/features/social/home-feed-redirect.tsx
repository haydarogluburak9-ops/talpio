'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { apiClient } from '@/lib/api';
import { INTEREST_ONBOARDING_PATH, needsInterestOnboarding } from '@/lib/interest-onboarding';

/** Giriş yapmış kullanıcıyı pazarlama ana sayfasından akışa veya onboarding'e alır. */
export function HomeFeedRedirect() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session.data) return;

    void (async () => {
      try {
        const follows = await apiClient.social.listCategoryFollows();
        router.replace(
          needsInterestOnboarding(follows.length) ? INTEREST_ONBOARDING_PATH : '/akis',
        );
      } catch {
        router.replace(INTEREST_ONBOARDING_PATH);
      }
    })();
  }, [session.data, router]);

  return null;
}
