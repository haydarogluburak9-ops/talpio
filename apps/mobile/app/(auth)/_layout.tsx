import { Stack } from 'expo-router';

import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: t('common.back'),
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: t('nav.login') }} />
      <Stack.Screen name="register" options={{ title: t('nav.register') }} />
      <Stack.Screen name="forgot-password" options={{ title: t('auth.forgotPassword') }} />
      <Stack.Screen name="role" options={{ title: t('roleSelect.title') }} />
    </Stack>
  );
}
