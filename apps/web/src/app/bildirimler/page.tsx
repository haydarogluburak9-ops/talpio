import type { Metadata } from 'next';

import { NotificationList } from '@/features/notifications/notification-list';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Bildirimler',
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t('notifications.title')}</h1>
      <NotificationList />
    </div>
  );
}
