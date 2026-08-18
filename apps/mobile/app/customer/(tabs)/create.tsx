import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export default function CustomerCreateTab() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Screen>
      <Text variant="title">{t('commerce.chooseTitle')}</Text>
      <Card onPress={() => router.push('/customer/jobs/new')} style={styles.card}>
        <Text variant="bodyStrong">{t('commerce.chooseJob')}</Text>
        <Text variant="caption" tone="muted">
          {t('commerce.chooseJobHint')}
        </Text>
      </Card>
      <Card onPress={() => router.push('/customer/requests/new')} style={styles.card}>
        <Text variant="bodyStrong">{t('commerce.chooseSupply')}</Text>
        <Text variant="caption" tone="muted">
          {t('commerce.chooseSupplyHint')}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
});
