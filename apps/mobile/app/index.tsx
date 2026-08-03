import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { UserRole } from '@ustapilot/types';

import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { palette } from '@/theme/tokens';

/**
 * Açılış yönlendiricisi. Oturum durumu okunana kadar marka ekranı gösterir,
 * sonra role göre müşteri veya usta sekmelerine yönlendirir.
 */
export default function Index() {
  const { status, role } = useSession();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <Text variant="displaySm" tone="onBrand">
          UstaPilot
        </Text>
        <Text variant="caption" style={styles.tagline}>
          Doğru usta. Doğru fiyat. Güvenli hizmet.
        </Text>
        <ActivityIndicator color={palette.accent[400]} />
      </View>
    );
  }

  if (status === 'anonymous') return <Redirect href="/(auth)/welcome" />;
  if (role === UserRole.PROVIDER) return <Redirect href="/provider/(tabs)/dashboard" />;
  return <Redirect href="/customer/(tabs)/home" />;
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
