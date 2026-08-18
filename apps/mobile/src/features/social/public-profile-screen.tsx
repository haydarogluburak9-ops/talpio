import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useFollow, useProfilePosts, useReportContent, useSocialProfile } from './use-social';

export function PublicProfileScreen({
  username,
  variant,
}: {
  username: string;
  variant: 'customer' | 'provider';
}) {
  const { t } = useI18n();
  const router = useRouter();
  const profile = useSocialProfile(username);
  const posts = useProfilePosts(username);
  const follow = useFollow();
  const report = useReportContent();

  if (profile.isPending) {
    return (
      <Screen>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen>
        <ErrorState
          title={t('social.profileNotFound')}
          retryLabel={t('common.retry')}
          onRetry={() => void profile.refetch()}
        />
      </Screen>
    );
  }

  const row = profile.data;
  const items = posts.data?.items ?? [];

  return (
    <Screen onRefresh={() => void profile.refetch()} refreshing={profile.isRefetching}>
      <Card>
        <View style={styles.header}>
          {row.avatarUrl ? (
            <Image source={{ uri: row.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text variant="title">{row.displayName.slice(0, 1)}</Text>
            </View>
          )}
          <View style={styles.copy}>
            <Text variant="title">{row.displayName}</Text>
            <Text variant="caption" tone="muted">
              @{row.username}
              {row.kind === 'BUSINESS' ? ` · ${t('social.storeBadge')}` : ''}
            </Text>
            <Text variant="caption" tone="muted">
              {t('social.analyticsFollowers')}: {row.followerCount} · {t('social.analyticsPosts')}:{' '}
              {row.postCount}
            </Text>
          </View>
        </View>
        {row.bio ? <Text style={{ marginTop: spacing.sm }}>{row.bio}</Text> : null}
        {!row.isFollowing ? (
          <Button
            label={t('social.followCta')}
            loading={follow.isPending}
            onPress={() => follow.mutate(row.username)}
            style={{ marginTop: spacing.md }}
          />
        ) : null}
        <Button
          label={t('social.reportProfile')}
          variant="outline"
          loading={report.isPending}
          onPress={() =>
            report.mutate({
              targetType: 'PROFILE',
              targetId: row.id,
              reason: t('social.reportReasonAbuse'),
            })
          }
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {items.length === 0 ? <EmptyState title={t('social.feedEmpty')} /> : null}
      {items.map((post) => (
        <Card
          key={post.id}
          onPress={() =>
            post.author?.username
              ? router.push(`/${variant}/u/${post.author.username}` as never)
              : undefined
          }
        >
          {post.body ? <Text>{post.body}</Text> : null}
          {post.media[0]?.url ? (
            <Image source={{ uri: post.media[0].url }} style={styles.media} />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  media: { width: '100%', height: 180, borderRadius: 12, marginTop: spacing.sm },
});
