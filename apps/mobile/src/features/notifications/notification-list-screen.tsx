import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { formatRelativeTime, renderNotification } from '@talpio/localization';
import type { Notification } from '@talpio/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { resolveMobileDeepLink } from './resolve-deep-link';
import { useMarkAllRead, useMarkRead, useNotifications } from './use-notifications';

export function NotificationListScreen() {
  const { t } = useI18n();
  const notifications = useNotifications({ limit: 50 });
  const markAllRead = useMarkAllRead();

  if (notifications.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('notifications.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void notifications.refetch()}
        />
      </Screen>
    );
  }

  if (notifications.isPending) {
    return (
      <Screen>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  const items = notifications.data.items;
  const unreadCount = notifications.data.meta.unreadCount;

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="notifications-outline"
          title={t('notifications.empty')}
          description={t('notifications.emptyDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {unreadCount > 0 ? (
        <View style={styles.toolbar}>
          <Text variant="caption" tone="muted">
            {t('notifications.unreadCount', { count: unreadCount })}
          </Text>
          <Button
            label={t('notifications.markAllRead')}
            variant="ghost"
            size="sm"
            loading={markAllRead.isPending}
            onPress={() => markAllRead.mutate()}
          />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={notifications.isRefetching}
        onRefresh={() => void notifications.refetch()}
        renderItem={({ item }) => <NotificationRow notification={item} />}
      />
    </Screen>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const markRead = useMarkRead();
  const href = resolveMobileDeepLink(notification.deepLink);
  const unread = !notification.readAt;
  const rendered = renderNotification(notification.type, notification.params, locale);

  async function open() {
    if (unread) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        // Okundu damgası başarısız olsa bile hedefe gidilir.
      }
    }
    if (href) router.push(href);
  }

  return (
    <Pressable onPress={() => void open()} accessibilityRole="button" accessibilityLabel={t('notifications.open')}>
      <Card
        style={[
          styles.card,
          unread && { borderColor: colors.brand, backgroundColor: colors.surfaceMuted },
        ]}
      >
        <View style={styles.row}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {rendered.title}
          </Text>
          <Text variant="caption" tone="muted">
            {formatRelativeTime(notification.createdAt, locale)}
          </Text>
        </View>
        <Text variant="body" tone="muted" numberOfLines={3}>
          {rendered.body}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
  },
});
