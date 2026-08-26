import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { SOCIAL } from '@talpio/config';
import type { SocialPost } from '@talpio/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { DiscoverGrid } from './discover-grid';
import { DiscoverViewer } from './discover-viewer';
import {
  useFollow,
  useFollowers,
  useFollowingList,
  useProfilePosts,
  useReportContent,
  useSavedPosts,
  useSocialMe,
  useSocialProfile,
} from './use-social';
import { ProfileGraphList } from './profile-graph-list';
import { ProfileHighlightsSection } from './profile-highlights';
import { ProfileSidebar } from './profile-career-section';
import { EditableProfileAvatar, EditableProfileCover } from './profile-media-editor';

type ProfileTab = 'posts' | 'followers' | 'following' | 'saved';

export function PublicProfileScreen({
  username,
  variant,
}: {
  username: string;
  variant: 'customer' | 'provider';
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const profile = useSocialProfile(username);
  const me = useSocialMe();
  const posts = useProfilePosts(username);
  const follow = useFollow();
  const report = useReportContent();
  const [tab, setTab] = useState<ProfileTab>('posts');
  const isOwnProfile = me.data?.username === username;
  const followers = useFollowers(username, tab === 'followers');
  const following = useFollowingList(username, tab === 'following');
  const saved = useSavedPosts(isOwnProfile && tab === 'saved');

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
  const isOwn = me.data?.username === row.username;
  const store = row.kind === 'BUSINESS' ? row.business : null;
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'posts', label: t('social.posts') },
    { id: 'followers', label: t('social.followersTab') },
    { id: 'following', label: t('social.followingTab') },
    ...(isOwn ? [{ id: 'saved' as const, label: t('nav.saved') }] : []),
  ];

  return (
    <Screen onRefresh={() => void profile.refetch()} refreshing={profile.isRefetching}>
      <Card padded={false} style={styles.profileCard}>
        {isOwn ? <EditableProfileCover coverUrl={row.coverUrl} /> : <ProfileCover coverUrl={row.coverUrl} />}

        <View style={styles.profileBody}>
          <View style={styles.identityRow}>
            {isOwn ? (
              <EditableProfileAvatar name={row.displayName} avatarUrl={row.avatarUrl} />
            ) : (
              <ProfileAvatar name={row.displayName} url={row.avatarUrl} />
            )}

            <View style={styles.copy}>
              <Text variant="title">{row.displayName}</Text>
              <Text variant="caption" tone="muted">
                @{row.username}
                {row.kind === 'BUSINESS' ? ` · ${t('social.storeBadge')}` : ''}
              </Text>
              {row.headline ? (
                <Text variant="caption">{row.headline}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.statRow}>
            <Stat
              label={t('social.posts')}
              value={row.postCount}
              onPress={() => setTab('posts')}
            />
            <Stat
              label={t('social.followers')}
              value={row.followerCount}
              onPress={() => setTab('followers')}
            />
            <Stat
              label={t('social.following')}
              value={row.followingCount}
              onPress={() => setTab('following')}
            />
          </View>

          {!isOwn ? (
            <>
              {!row.isFollowing ? (
                <Button
                  label={t('social.followCta')}
                  loading={follow.isPending}
                  onPress={() => follow.mutate(row.username)}
                  style={styles.action}
                />
              ) : null}
              {store ? (
                <Button
                  label={t('social.requestQuoteCta')}
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/customer/requests/new',
                      params: { storeUsername: row.username },
                    })
                  }
                  style={styles.quote}
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
                style={styles.report}
              />
            </>
          ) : null}
        </View>
      </Card>

      <ProfileSidebar profile={row} isOwn={isOwn} />

      <ProfileHighlightsSection profile={row} />

      <View style={styles.tabRow}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={[
                styles.tab,
                active && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
              ]}
            >
              <Text
                variant="caption"
                tone={active ? 'default' : 'muted'}
                style={active ? styles.tabLabelActive : undefined}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'followers' ? (
        <ProfileGraphList
          pending={followers.isPending}
          items={followers.data?.items ?? []}
          totalCount={row.followerCount}
          countLabel={t('social.followersCountLabel', { count: row.followerCount })}
          searchLabel={t('social.searchFollowers')}
          variant={variant}
        />
      ) : tab === 'following' ? (
        <ProfileGraphList
          pending={following.isPending}
          items={following.data?.items ?? []}
          totalCount={row.followingCount}
          countLabel={t('social.followingCountLabel', { count: row.followingCount })}
          searchLabel={t('social.searchFollowing')}
          variant={variant}
        />
      ) : tab === 'saved' ? (
        <PostGrid
          pending={saved.isPending}
          posts={saved.data?.items ?? []}
          emptyTitle={t('social.savedEmpty')}
        />
      ) : (
        <PostGrid
          pending={posts.isPending}
          posts={items}
          emptyTitle={t('social.feedEmpty')}
        />
      )}
    </Screen>
  );
}

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.stat} hitSlop={4}>
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </Pressable>
  );
}

/** Profil gönderileri; keşfetteki kare ızgara ve tam ekran görüntüleyiciyi kullanır. */
function PostGrid({
  pending,
  posts,
  emptyTitle,
}: {
  pending: boolean;
  posts: SocialPost[];
  emptyTitle: string;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (pending) return <ListSkeleton rows={3} />;
  if (posts.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <>
      <DiscoverGrid posts={posts} onSelect={setViewerIndex} />
      {viewerIndex !== null ? (
        <DiscoverViewer
          posts={posts}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </>
  );
}

function ProfileCover({ coverUrl }: { coverUrl?: string | null }) {
  const colors = useColors();

  return (
    <View style={styles.coverWrap}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.coverImage} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.coverFallback, { backgroundColor: colors.brand }]} />
      )}
    </View>
  );
}

function ProfileAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.avatar} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={styles.avatarFallback}>
      <Text variant="title">{name.slice(0, 1).toLocaleUpperCase()}</Text>
    </View>
  );
}

const AVATAR_SIZE = 80;
const AVATAR_OVERLAP = AVATAR_SIZE / 2;

const styles = StyleSheet.create({
  profileCard: { overflow: 'hidden' },
  coverWrap: {
    width: '100%',
    aspectRatio: SOCIAL.coverAspectRatio,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverFallback: { width: '100%', height: '100%', opacity: 0.85 },
  profileBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  identityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
    marginTop: -AVATAR_OVERLAP,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.card,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.card,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
  },
  copy: { flex: 1, gap: 4, paddingBottom: spacing.xs },
  action: { marginTop: spacing.md },
  quote: { marginTop: spacing.sm },
  report: { marginTop: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  stat: { alignItems: 'center', gap: 2 },
  tabRow: { flexDirection: 'row', gap: spacing.xs },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabelActive: { fontWeight: '700' },
});
