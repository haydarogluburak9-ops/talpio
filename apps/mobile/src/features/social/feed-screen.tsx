import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { SocialPost } from '@talpio/types';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { StoriesRail } from '@/features/social/stories-rail';
import {
  useCreatePost,
  useFollow,
  useLikePost,
  useReportContent,
  useSavePost,
  useSharePost,
  useSocialFeed,
  useUnlikePost,
  useUnsavePost,
} from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

const DEALISH = new Set([
  'DEAL',
  'SPECIAL_PRICE',
  'DISCOUNT',
  'BULK_PRICE',
  'LIMITED_STOCK',
  'CLEARANCE',
  'SERVICE_PROMOTION',
  'NEW_PRODUCT',
]);

export function SocialFeedScreen() {
  const { t } = useI18n();
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  const feed = useSocialFeed(loggedIn);
  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const share = useSharePost();
  const follow = useFollow();
  const createPost = useCreatePost();
  const report = useReportContent();

  const posts = (feed.data?.items ?? [])
    .map((item) => item.post)
    .filter((post): post is NonNullable<typeof post> => Boolean(post));

  return (
    <Screen onRefresh={() => void feed.refetch()} refreshing={feed.isRefetching}>
      <Text variant="title">{t('social.feedTitle')}</Text>
      <Text variant="caption" style={{ marginBottom: spacing.sm }}>
        {t('social.feedSubtitle')}
      </Text>
      <StoriesRail />

      {!loggedIn && (
        <EmptyState title={t('social.feedTitle')} description={t('social.loginToInteract')} />
      )}

      {loggedIn && feed.isPending && <ListSkeleton rows={4} />}

      {loggedIn && feed.isError && (
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void feed.refetch()}
        />
      )}

      {loggedIn && !feed.isPending && !feed.isError && posts.length === 0 && (
        <EmptyState title={t('social.feedEmpty')} description={t('social.feedEmptyHint')} />
      )}

      {posts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          onLike={() => (post.likedByMe ? unlike.mutate(post.id) : like.mutate(post.id))}
          onSave={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}
          onShare={() => share.mutate(post.id)}
          onRepost={() => createPost.mutate({ originalPostId: post.originalPostId ?? post.id })}
          onFollow={() => post.author?.username && follow.mutate(post.author.username)}
          onReport={(reason) => report.mutate({ targetType: 'POST', targetId: post.id, reason })}
        />
      ))}
    </Screen>
  );
}

function FeedPostCard({
  post,
  onLike,
  onSave,
  onShare,
  onRepost,
  onFollow,
  onReport,
}: {
  post: SocialPost;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onRepost: () => void;
  onFollow: () => void;
  onReport: (reason: string) => void;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const image = post.media.find((file) => file.mimeType.startsWith('image/'));
  const tags = post.hashtags ?? [];
  const dealish = DEALISH.has(post.type) || Boolean(post.deal) || Boolean(post.promo);

  return (
    <Card>
      <Pressable
        onPress={() =>
          post.author?.username
            ? router.push(`/customer/u/${post.author.username}` as never)
            : undefined
        }
      >
        <View style={styles.authorRow}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{post.author?.displayName ?? `@${post.author?.username ?? '—'}`}</Text>
            <Text variant="caption" style={{ color: colors.foregroundMuted }}>
              @{post.author?.username ?? '—'}
              {post.author?.kind === 'BUSINESS' ? ` · ${t('social.storeBadge')}` : ''}
              {dealish ? ` · ${t('social.dealBadge')}` : ''}
              {post.type === 'REQUEST_SHARE' ? ` · ${t('social.requestBadge')}` : ''}
              {post.type === 'REPOST' ? ` · ${t('social.repostedBy')}` : ''}
            </Text>
          </View>
          {post.author && !post.author.isFollowing ? (
            <Pressable onPress={onFollow}>
              <Text variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
                {t('social.followCta')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
      {post.body ? <Text style={{ marginTop: spacing.xs }}>{post.body}</Text> : null}
      {tags.length > 0 ? (
        <Text variant="caption" style={{ marginTop: spacing.xs, color: colors.accent }}>
          {tags.map((tag) => `#${tag}`).join('  ')}
        </Text>
      ) : null}
      {post.deal?.title || post.promo?.label ? (
        <Text variant="caption" style={{ marginTop: spacing.xs, color: colors.brand }}>
          {post.deal?.title ?? post.promo?.label}
        </Text>
      ) : null}
      {image ? (
        <Image
          source={{ uri: image.url }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : null}
      <Text variant="caption" style={{ marginTop: spacing.sm, color: colors.foregroundMuted }}>
        {t('social.likesCount', { count: post.likeCount ?? 0 })} ·{' '}
        {t('social.commentsCount', { count: post.commentCount ?? 0 })} ·{' '}
        {t('social.sharesCount', { count: post.shareCount ?? 0 })} ·{' '}
        {t('social.savesCount', { count: post.saveCount ?? 0 })}
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onLike}>
          <Text variant="caption" style={{ fontWeight: '700', color: post.likedByMe ? colors.danger : colors.foreground }}>
            {t('social.like')}
          </Text>
        </Pressable>
        <Pressable onPress={onShare}>
          <Text variant="caption" style={{ fontWeight: '700' }}>
            {t('social.share')}
          </Text>
        </Pressable>
        <Pressable onPress={onRepost}>
          <Text variant="caption" style={{ fontWeight: '700' }}>
            {t('social.repost')}
          </Text>
        </Pressable>
        <Pressable onPress={onSave}>
          <Text variant="caption" style={{ fontWeight: '700', color: post.savedByMe ? colors.accent : colors.foreground }}>
            {t('social.save')}
          </Text>
        </Pressable>
        <Pressable onPress={() => setReportOpen((open) => !open)}>
          <Text variant="caption" style={{ fontWeight: '700', color: colors.danger }}>
            {t('social.report')}
          </Text>
        </Pressable>
      </View>
      {reportOpen ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          {(
            [
              'social.reportReasonSpam',
              'social.reportReasonAbuse',
              'social.reportReasonSexual',
              'social.reportReasonIllegal',
              'social.reportReasonOther',
            ] as const
          ).map((key) => (
            <Pressable
              key={key}
              onPress={() => {
                onReport(t(key));
                setReportOpen(false);
              }}
            >
              <Text variant="caption">{t(key)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', height: 220, borderRadius: 16, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
