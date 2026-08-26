import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/session-provider';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';

/**
 * Müşteri bölümü. Sekmeler bu yığının kökündedir; detay ekranları sekmelerin
 * üzerine itilir, böylece alt çubuk detayda gizlenir.
 */
export default function CustomerLayout() {
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
      <Stack.Screen name="categories/[slug]" options={{ title: t('nav.categories') }} />
      <Stack.Screen name="jobs/new" options={{ title: t('job.createTitle') }} />
      <Stack.Screen name="jobs/[id]" options={{ title: t('job.detailTitle') }} />
      <Stack.Screen name="jobs/[id]/offers" options={{ title: t('job.offersTitle') }} />
      <Stack.Screen name="offers/[id]" options={{ title: t('offer.detailTitle') }} />
      <Stack.Screen name="orders/index" options={{ title: t('order.listTitle') }} />
      <Stack.Screen name="orders/[id]" options={{ title: t('order.detailTitle') }} />
      <Stack.Screen name="orders/[id]/review" options={{ title: t('review.createTitle') }} />
      <Stack.Screen name="reviews/index" options={{ title: t('review.writtenTitle') }} />
      <Stack.Screen name="payments/index" options={{ title: t('payment.historyTitle') }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="providers/index" options={{ title: t('provider.discoverTitle') }} />
      <Stack.Screen name="providers/[id]" options={{ title: t('provider.profileTitle') }} />
      <Stack.Screen name="profile/edit" options={{ title: t('profile.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      <Stack.Screen name="support/index" options={{ title: t('support.listTitle') }} />
      <Stack.Screen name="support/new" options={{ title: t('support.createTitle') }} />
      <Stack.Screen name="support/[id]" options={{ title: t('support.detailTitle') }} />
      <Stack.Screen name="complaint" options={{ title: t('complaint.createTitle') }} />
      <Stack.Screen name="requests/index" options={{ title: t('commerce.myListTitle') }} />
      <Stack.Screen name="requests/new" options={{ title: t('commerce.createTitle') }} />
      <Stack.Screen name="requests/[id]" options={{ title: t('commerce.detailTitle') }} />
      <Stack.Screen name="u/[username]" options={{ title: t('profile.title') }} />
      <Stack.Screen name="messages/new" options={{ title: t('messaging.newMessage') }} />
    </Stack>
  );
}
