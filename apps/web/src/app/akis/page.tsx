import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FeedList } from '@/features/social/feed-list';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('social.feedTitle');
}

export default async function FeedPage() {
  await applyRequestLocale();
  return (
    <SocialShell>
      <div className="mb-3 px-0.5 lg:hidden">
        <h1 className="text-xl font-bold tracking-tight text-brand-900 dark:text-foreground">
          {t('social.feedTitle')}
        </h1>
        <p className="mt-0.5 text-sm text-foreground-muted">{t('common.tagline')}</p>
      </div>
      <Suspense fallback={null}>
        <FeedList />
      </Suspense>
    </SocialShell>
  );
}
