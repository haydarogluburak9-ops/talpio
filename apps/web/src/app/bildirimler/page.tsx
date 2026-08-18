import type { Metadata } from 'next';

import { NotificationList } from '@/features/notifications/notification-list';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.notifications'),
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <SocialShell showRail={false}>
      <div className="social-panel mb-4 p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('notifications.title')}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('notifications.emptyDescription')}</p>
      </div>
      <NotificationList />
    </SocialShell>
  );
}
