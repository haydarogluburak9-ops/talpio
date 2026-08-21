import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { SOCIAL } from '@talpio/config';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { useFollow, useProfilePosts, useReportContent, useSocialMe, useSocialProfile } from './use-social';
import { ProfileHighlightsSection } from './profile-highlights';
import { ProfileCareerSection } from './profile-career-section';
import { EditableProfileAvatar, EditableProfileCover } from './profile-media-editor';

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
  const me = useSocialMe();
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
  const isOwn = me.data?.username === row.username;

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
              <Text variant="caption" tone="muted">
                {t('social.analyticsFollowers')}: {row.followerCount} · {t('social.analyticsPosts')}:{' '}
                {row.postCount}
              </Text>
            </View>
          </View>

          {row.bio ? <Text style={styles.bio}>{row.bio}</Text> : null}

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

      <ProfileCareerSection profile={row} />

      <ProfileHighlightsSection profile={row} />

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
  bio: { marginTop: spacing.md },
  action: { marginTop: spacing.md },
  report: { marginTop: spacing.sm },
  media: { width: '100%', height: 180, borderRadius: 12, marginTop: spacing.sm },
});
