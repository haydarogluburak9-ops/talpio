'use client';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useSocialAnalytics } from './use-social';

/** SC6 — sağ rayda basit sosyal özet. */
export function SocialAnalyticsCard() {
  const session = useSession();
  const analytics = useSocialAnalytics(Boolean(session.data));

  if (!session.data || !analytics.data) return null;

  const items = [
    { label: t('social.analyticsFollowers'), value: analytics.data.followerCount },
    { label: t('social.analyticsPosts'), value: analytics.data.postCount },
    { label: t('social.analyticsLikes'), value: analytics.data.totalLikes },
    { label: t('social.analyticsShares'), value: analytics.data.totalShares ?? 0 },
    { label: t('social.analyticsDeals'), value: analytics.data.dealPostCount },
  ];

  return (
    <div className="social-panel p-5">
      <p className="mb-4 font-display text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
        {t('social.analyticsTitle')}
      </p>
      <dl className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-foreground-muted">{item.label}</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
