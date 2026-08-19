import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { PostComposer } from '@/features/social/post-composer';
import { QuickActions } from '@/features/social/quick-actions';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export default function CustomerCreateTab() {
  const { t } = useI18n();
  const router = useRouter();
  const [mediaTrigger, setMediaTrigger] = useState(0);

  return (
    <Screen>
      <Text variant="title">{t('social.composeSheetTitle')}</Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: spacing.md }}>
        {t('social.feedSubtitle')}
      </Text>
      <PostComposer
        mediaTrigger={mediaTrigger}
        onPublished={() => router.push('/customer/(tabs)/feed')}
      />
      <QuickActions onMedia={() => setMediaTrigger((value) => value + 1)} />
    </Screen>
  );
}
