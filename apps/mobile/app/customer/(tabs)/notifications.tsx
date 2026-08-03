import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/state-views';
import { useI18n } from '@/lib/i18n';

export default function CustomerNotificationsScreen() {
  const { t } = useI18n();

  return (
    <Screen>
      <EmptyState
        icon="notifications-outline"
        title={t('notifications.empty')}
        description={t('status.comingSoonMessage')}
      />
    </Screen>
  );
}
