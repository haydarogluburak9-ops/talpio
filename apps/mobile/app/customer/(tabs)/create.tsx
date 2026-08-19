import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { ComposeMenu } from '@/features/social/compose-menu';
import { PostComposer } from '@/features/social/post-composer';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export default function CustomerCreateTab() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'post' | 'deal'>('menu');

  return (
    <Screen>
      {mode === 'menu' ? (
        <>
          <Text variant="title">{t('social.composeMenuTitle')}</Text>
          <ComposeMenu onPost={() => setMode('post')} onDeal={() => setMode('deal')} />
        </>
      ) : (
        <>
          <Pressable onPress={() => setMode('menu')} style={{ marginBottom: spacing.sm }}>
            <Text variant="caption" tone="brand">
              ← {t('common.back')}
            </Text>
          </Pressable>
          <PostComposer
            onPublished={() => router.push('/customer/(tabs)/feed')}
          />
        </>
      )}
    </Screen>
  );
}
