import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/state-views';
import { useI18n } from '@/lib/i18n';

/**
 * Arayüzü hazır, veri bağlantısı henüz kurulmamış ekranlar için.
 *
 * Bilinçli olarak "yakında" demez: kullanıcıya bu bölümün API ucunun sonraki
 * aşamada bağlanacağı açıkça söylenir. Sahte veri gösterilmez.
 */
export function PendingScreen({
  title,
  icon = 'construct-outline',
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { t } = useI18n();

  return (
    <Screen>
      <EmptyState icon={icon} title={title} description={t('status.comingSoonMessage')} />
    </Screen>
  );
}
