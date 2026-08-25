import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { SocialPost } from '@talpio/types';

import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import {
  useCreatePost,
  useFollow,
  useLikePost,
  useReportContent,
  useSavePost,
  useSharePost,
  useUnlikePost,
  useUnsavePost,
} from './use-social';

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

/**
 * Gönderi kartı; akış ve Keşfet görüntüleyicisi aynı bileşeni kullanır.
 * Etkileşim mutasyonları kart içinde tutulur, çağıran ekran callback vermez.
 */
export function PostCard({ post, mediaHeight = 220 }: { post: SocialPost; mediaHeight?: number }) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);

  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const share = useSharePost();
  const repost = useCreatePost();
  const follow = useFollow();
  const report = useReportContent();

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
          <View style={styles.authorCopy}>
            <Text variant="bodyStrong">
              {post.author?.displayName ?? `@${post.author?.username ?? '—'}`}
            </Text>
            <Text variant="caption" tone="muted">
              @{post.author?.username ?? '—'}
              {post.author?.kind === 'BUSINESS' ? ` · ${t('social.storeBadge')}` : ''}
              {dealish ? ` · ${t('social.dealBadge')}` : ''}
              {post.type === 'REQUEST_SHARE' ? ` · ${t('social.requestBadge')}` : ''}
              {post.type === 'REPOST' ? ` · ${t('social.repostedBy')}` : ''}
            </Text>
          </View>
          {post.author && !post.author.isFollowing ? (
            <Pressable onPress={() => post.author && follow.mutate(post.author.username)}>
              <Text variant="caption" style={[styles.strong, { color: colors.accent }]}>
                {t('social.followCta')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}

      {tags.length > 0 ? (
        <Text variant="caption" style={[styles.body, { color: colors.accent }]}>
          {tags.map((tag) => `#${tag}`).join('  ')}
        </Text>
      ) : null}

      {post.deal?.title || post.promo?.label ? (
        <Text variant="caption" style={[styles.body, { color: colors.brand }]}>
          {post.deal?.title ?? post.promo?.label}
        </Text>
      ) : null}

      {image ? (
        <Image
          source={{ uri: image.url }}
          style={[styles.media, { height: mediaHeight }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <Text variant="caption" tone="muted" style={styles.counts}>
        {t('social.likesCount', { count: post.likeCount ?? 0 })} ·{' '}
        {t('social.commentsCount', { count: post.commentCount ?? 0 })} ·{' '}
        {t('social.sharesCount', { count: post.shareCount ?? 0 })} ·{' '}
        {t('social.savesCount', { count: post.saveCount ?? 0 })}
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={() => (post.likedByMe ? unlike.mutate(post.id) : like.mutate(post.id))}>
          <Text
            variant="caption"
            style={[styles.strong, { color: post.likedByMe ? colors.danger : colors.foreground }]}
          >
            {t('social.like')}
          </Text>
        </Pressable>
        <Pressable onPress={() => share.mutate(post.id)}>
          <Text variant="caption" style={styles.strong}>
            {t('social.share')}
          </Text>
        </Pressable>
        <Pressable onPress={() => repost.mutate({ originalPostId: post.originalPostId ?? post.id })}>
          <Text variant="caption" style={styles.strong}>
            {t('social.repost')}
          </Text>
        </Pressable>
        <Pressable onPress={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}>
          <Text
            variant="caption"
            style={[styles.strong, { color: post.savedByMe ? colors.accent : colors.foreground }]}
          >
            {t('social.save')}
          </Text>
        </Pressable>
        <Pressable onPress={() => setReportOpen((open) => !open)}>
          <Text variant="caption" style={[styles.strong, { color: colors.danger }]}>
            {t('social.report')}
          </Text>
        </Pressable>
      </View>

      {reportOpen ? (
        <View style={styles.reasons}>
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
                report.mutate({ targetType: 'POST', targetId: post.id, reason: t(key) });
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
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorCopy: { flex: 1 },
  body: { marginTop: spacing.xs },
  media: { width: '100%', borderRadius: 16, marginTop: spacing.sm },
  counts: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  reasons: { marginTop: spacing.sm, gap: spacing.xs },
  strong: { fontWeight: '700' },
});
