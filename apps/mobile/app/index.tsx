import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { useT } from '@/lib/i18n';
import { palette } from '@/theme/tokens';

/**
 * Açılış yönlendiricisi. Oturum durumu okunana kadar marka ekranı gösterir,
 * sonra tek sosyal akışa yönlendirir.
 */
export default function Index() {
  const { status } = useSession();
  const t = useT();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <Text variant="displaySm" tone="onBrand">
          {t('common.appName')}
        </Text>
        <Text variant="caption" style={styles.tagline}>
          {t('common.trustTagline')}
        </Text>
        <ActivityIndicator color={palette.accent[400]} />
      </View>
    );
  }

  if (status === 'anonymous') return <Redirect href="/(auth)/welcome" />;
  return <Redirect href="/customer/(tabs)/feed" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: palette.brand[900],
  },
  tagline: { color: palette.brand[200] },
});
