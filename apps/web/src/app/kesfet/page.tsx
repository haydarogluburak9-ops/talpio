import type { Metadata } from 'next';

import { DiscoverFeed } from '@/features/social/discover-feed';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('social.discoverTitle');
}

export default async function DiscoverPage() {
  await applyRequestLocale();
  return (
    <SocialShell>
      <div className="social-panel mb-3 p-5 sm:p-6">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
          Tal<span className="text-brand-800 dark:text-brand-200">pio</span>
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
          {t('social.discoverTitle')}
        </h1>
        <p className="mt-1 max-w-md text-sm text-foreground-muted text-balance-safe">
          {t('social.discoverSubtitle')}
        </p>
      </div>
      <DiscoverFeed />
    </SocialShell>
  );
}
