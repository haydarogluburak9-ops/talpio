import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/session-provider';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';

export default function ProviderLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { status } = useSession();

  if (status === 'anonymous') return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: t('common.back'),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="jobs/[id]" options={{ title: t('job.detailTitle') }} />
      <Stack.Screen name="offers/new" options={{ title: t('offer.createTitle') }} />
      <Stack.Screen name="offers/index" options={{ title: t('offer.listTitle') }} />
      <Stack.Screen name="offers/[id]" options={{ title: t('offer.detailTitle') }} />
      <Stack.Screen name="orders/[id]" options={{ title: t('order.detailTitle') }} />
      <Stack.Screen name="reviews/index" options={{ title: t('review.receivedTitle') }} />
      <Stack.Screen name="wallet/index" options={{ title: t('payment.walletTitle') }} />
      <Stack.Screen name="messages/index" options={{ title: t('messaging.listTitle') }} />
      <Stack.Screen name="notifications" options={{ title: t('notifications.title') }} />
      <Stack.Screen name="chat/[id]" options={{ title: t('messaging.chatTitle') }} />
      <Stack.Screen name="profile/edit" options={{ title: t('profile.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}
