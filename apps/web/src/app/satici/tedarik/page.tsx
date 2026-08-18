import type { Metadata } from 'next';

import { MatchedRequestsPanel } from '@/features/requests/matched-requests-panel';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('commerce.matchedTitle'),
  robots: { index: false, follow: false },
};

export default function ProviderSupplyPage() {
  return (
    <SocialShell showRail={false}>
      <div className="social-panel mb-4 p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('commerce.matchedHeading')}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t('commerce.matchedHint')}
        </p>
      </div>
      <MatchedRequestsPanel />
    </SocialShell>
  );
}
