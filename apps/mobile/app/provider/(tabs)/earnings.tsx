import { PendingScreen } from '@/components/pending-screen';
import { useI18n } from '@/lib/i18n';

export default function ProviderEarningsScreen() {
  const { t } = useI18n();
  return <PendingScreen title={t('provider.earningsTitle')} icon="wallet-outline" />;
}
