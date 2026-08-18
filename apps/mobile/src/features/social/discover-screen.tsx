import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import {
  useDiscoverFeed,
  useFollow,
  useLikePost,
  useSavePost,
  useTrending,
  useUnlikePost,
  useUnsavePost,
  useReportContent,
} from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export function SocialDiscoverScreen() {
  const { t } = useI18n();
  const colors = useColors();
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  const feed = useDiscoverFeed(loggedIn);
  const trending = useTrending(loggedIn);
  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const follow = useFollow();
  const report = useReportContent();

  const posts = (feed.data?.items ?? [])
    .map((item) => item.post)
    .filter((post): post is NonNullable<typeof post> => Boolean(post));

  const businesses = posts
    .map((post) => post.author)
    .filter((author): author is NonNullable<typeof author> => Boolean(author))
    .filter((author, index, list) => list.findIndex((item) => item.id === author.id) === index)
    .filter((author) => author.kind === 'BUSINESS')
    .slice(0, 6);

  return (
    <Screen onRefresh={() => void feed.refetch()} refreshing={feed.isRefetching}>
      <Text variant="title">{t('social.discoverTitle')}</Text>
      <Text variant="caption" style={{ marginBottom: spacing.sm }}>
        {t('social.discoverSubtitle')}
      </Text>

      {trending.data && trending.data.length > 0 ? (
        <>
          <Text variant="bodyStrong">{t('social.trendingTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
            {trending.data.map((topic) => (
              <View
                key={topic.slug}
                style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}
              >
                <Text variant="caption" style={{ fontWeight: '700' }}>
                  #{topic.display}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {businesses.length > 0 ? (
        <>
          <Text variant="bodyStrong">{t('social.suggestedBusinesses')}</Text>
          {businesses.map((author) => (
            <Card key={author.id}>
              <Text variant="bodyStrong">{author.displayName}</Text>
              <Text variant="caption" tone="muted">
                @{author.username}
              </Text>
              <Pressable
                onPress={() => follow.mutate(author.username)}
                style={{ marginTop: spacing.xs }}
              >
                <Text variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
                  {t('social.followCta')}
                </Text>
              </Pressable>
            </Card>
          ))}
        </>
      ) : null}

      {!loggedIn && (
        <EmptyState title={t('social.discoverTitle')} description={t('social.loginToInteract')} />
      )}
      {loggedIn && feed.isPending && <ListSkeleton rows={3} />}
      {loggedIn && feed.isError && (
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void feed.refetch()}
        />
      )}

      {posts.map((post) => (
        <Card key={post.id}>
          <Text variant="bodyStrong">{post.author?.displayName ?? post.author?.username}</Text>
          {post.body ? <Text style={{ marginTop: spacing.xs }}>{post.body}</Text> : null}
          {(post.hashtags ?? []).length > 0 ? (
            <Text variant="caption" style={{ marginTop: spacing.xs, color: colors.accent }}>
              {(post.hashtags ?? []).map((tag) => `#${tag}`).join('  ')}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={() => (post.likedByMe ? unlike.mutate(post.id) : like.mutate(post.id))}>
              <Text variant="caption">
                {t('social.like')} {post.likeCount ?? 0}
              </Text>
            </Pressable>
            <Pressable>
              <Text variant="caption">
                {t('social.comment')} {post.commentCount ?? 0}
              </Text>
            </Pressable>
            <Pressable onPress={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}>
              <Text variant="caption">
                {t('social.save')} {post.saveCount ?? 0}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                report.mutate({
                  targetType: 'POST',
                  targetId: post.id,
                  reason: t('social.reportReasonSpam'),
                })
              }
            >
              <Text variant="caption">{t('social.report')}</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
