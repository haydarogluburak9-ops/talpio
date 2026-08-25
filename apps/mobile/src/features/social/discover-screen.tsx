import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { SocialPost } from '@talpio/types';

import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { useDiscoverFeed, useTrending } from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme/tokens';

import { DiscoverGrid } from './discover-grid';
import { DiscoverViewer } from './discover-viewer';

export function SocialDiscoverScreen() {
  const { t } = useI18n();
  const colors = useColors();
  const { status } = useSession();
  const loggedIn = status === 'authenticated';

  const [query, setQuery] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const feed = useDiscoverFeed(loggedIn);
  const trending = useTrending(loggedIn);

  const posts = filterPosts(
    (feed.data?.items ?? [])
      .map((item) => item.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post)),
    query,
  );

  return (
    <Screen onRefresh={() => void feed.refetch()} refreshing={feed.isRefetching}>
      <View>
        <Text variant="title">{t('social.discoverTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('social.discoverSubtitle')}
        </Text>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="search" size={18} color={colors.foregroundMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('social.searchPlaceholder')}
          placeholderTextColor={colors.foregroundMuted}
          accessibilityLabel={t('common.search')}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.searchInput, typography.body, { color: colors.foreground }]}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => setQuery('')}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.foregroundMuted} />
          </Pressable>
        ) : null}
      </View>

      {trending.data && trending.data.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {trending.data.map((topic) => {
            const active = query.replace(/^#/, '').toLocaleLowerCase() === topic.slug.toLocaleLowerCase();
            return (
              <Pressable
                key={topic.slug}
                accessibilityRole="button"
                onPress={() => setQuery(active ? '' : `#${topic.slug}`)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.accent : colors.surfaceMuted },
                ]}
              >
                <Text
                  variant="caption"
                  style={[styles.chipLabel, active ? { color: colors.onAccent } : null]}
                >
                  #{topic.display}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {!loggedIn ? (
        <EmptyState title={t('social.discoverTitle')} description={t('social.loginToInteract')} />
      ) : feed.isPending ? (
        <ListSkeleton rows={3} />
      ) : feed.isError ? (
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void feed.refetch()}
        />
      ) : posts.length === 0 ? (
        <EmptyState title={t('social.discoverEmpty')} description={t('social.feedEmptyHint')} />
      ) : (
        <DiscoverGrid posts={posts} onSelect={setViewerIndex} />
      )}

      {viewerIndex !== null ? (
        <DiscoverViewer
          posts={posts}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </Screen>
  );
}

/** Arama kutusu ve gündem etiketleri aynı süzgeci kullanır. */
function filterPosts(posts: SocialPost[], query: string): SocialPost[] {
  const needle = query.trim().replace(/^#/, '').toLocaleLowerCase();
  if (!needle) return posts;

  return posts.filter((post) =>
    [
      post.body ?? '',
      ...(post.hashtags ?? []),
      post.author?.displayName ?? '',
      post.author?.username ?? '',
      post.deal?.title ?? '',
      post.promo?.label ?? '',
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(needle),
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm },
  chipRow: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipLabel: { fontWeight: '700' },
});
