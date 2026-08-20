'use client';

import { BrandLockup, Button } from '@talpio/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InterestPicker } from '@/features/auth/interest-picker';
import { useSession } from '@/features/auth/use-session';
import { useCategoryFollows, useReplaceInterests } from '@/features/social/use-social';
import { INTEREST_ONBOARDING_PATH, MIN_INTERESTS, needsInterestOnboarding } from '@/lib/interest-onboarding';
import { t } from '@/lib/i18n';

/** Kayıt sonrası zorunlu ilgi alanı seçimi. */
export function InterestOnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const follows = useCategoryFollows(session.data != null);
  const replace = useReplaceInterests();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (session.isSuccess && session.data === null) {
      router.replace('/giris');
    }
  }, [session.data, session.isSuccess, router]);

  useEffect(() => {
    if (follows.data && !needsInterestOnboarding(follows.data.length)) {
      router.replace('/akis');
    }
  }, [follows.data, router]);

  const ready = selected.length >= MIN_INTERESTS;

  async function handleContinue() {
    if (!ready) return;
    await replace.mutateAsync(selected);
    router.push('/akis');
  }

  if (session.isPending || follows.isPending) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl items-center justify-center px-4">
        <p className="text-sm text-foreground-muted">{t('common.loading')}</p>
      </div>
    );
  }

  if (!session.data) return null;

  return (
    <div className="min-h-svh bg-white dark:bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
        <Link href="/" className="inline-flex w-fit" aria-label={t('common.appName')}>
          <BrandLockup className="h-8 sm:h-9" variant="light" />
        </Link>

        <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('auth.interestsOnboardingTitle')}
        </h1>
        <p className="text-sm leading-relaxed text-foreground-muted">{t('auth.interestsOnboardingDescription')}</p>
        </div>

      <InterestPicker selected={selected} onChange={setSelected} />

      <Button
        type="button"
        variant="accent"
        size="lg"
        className="w-full shadow-raised"
        disabled={!ready || replace.isPending}
        onClick={() => void handleContinue()}
      >
        {replace.isPending ? t('common.loading') : t('auth.interestsContinueToFeed')}
        {replace.isPending ? null : <ArrowRight className="size-4" aria-hidden />}
      </Button>
      </div>
    </div>
  );
}
