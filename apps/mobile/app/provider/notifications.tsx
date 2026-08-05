import { useEffect } from 'react';

import { NotificationListScreen } from '@/features/notifications/notification-list-screen';
import { registerPushToken } from '@/features/notifications/register-push-token';
import { useI18n } from '@/lib/i18n';

export default function ProviderNotificationsScreen() {
  const { locale } = useI18n();

  useEffect(() => {
    void registerPushToken(locale);
  }, [locale]);

  return <NotificationListScreen />;
}
