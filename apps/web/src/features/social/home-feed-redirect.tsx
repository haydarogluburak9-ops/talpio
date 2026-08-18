'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';

/** Giriş yapmış kullanıcıyı pazarlama ana sayfasından akışa alır. */
export function HomeFeedRedirect() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.data) {
      router.replace('/akis');
    }
  }, [session.data, router]);

  return null;
}
