import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { PostCard } from '@/features/social/post-card';
import { StoriesRail } from '@/features/social/stories-rail';
import { useSocialFeed } from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export function SocialFeedScreen() {
  const { t } = useI18n();
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  const feed = useSocialFeed(loggedIn);

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
        <PostCard key={post.id} post={post} />
      ))}
    </Screen>
  );
}
