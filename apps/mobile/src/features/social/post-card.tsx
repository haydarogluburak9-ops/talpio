import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { SocialPost } from '@talpio/types';

import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

import {
  useCreateComment,
  useCreatePost,
  useFollow,
  useLikePost,
  usePostComments,
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

const DOUBLE_TAP_MS = 300;
const CAPTION_LIMIT = 140;

/**
 * Instagram düzeninde gönderi kartı: ikon aksiyonları, çift dokunuş
 * beğeni ve satır içi yorumlar. Akış ekranı bu bileşeni kullanır.
 */
export function PostCard({ post, mediaHeight = 320 }: { post: SocialPost; mediaHeight?: number }) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const lastTapRef = useRef(0);
  const [burst] = useState(() => new Animated.Value(0));

  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const share = useSharePost();
  const repost = useCreatePost();
  const follow = useFollow();
  const report = useReportContent();
  const comments = usePostComments(post.id, showComments);
  const createComment = useCreateComment(post.id);

  const image = post.media.find((file) => file.mimeType.startsWith('image/'));
  const tags = post.hashtags ?? [];
  const dealish = DEALISH.has(post.type) || Boolean(post.deal) || Boolean(post.promo);
  const username = post.author?.username ?? '—';
  const body = post.body ?? '';
  const longBody = body.length > CAPTION_LIMIT;
  const caption = expanded || !longBody ? body : `${body.slice(0, CAPTION_LIMIT).trimEnd()}… `;

  function playBurst() {
    burst.setValue(0);
    Animated.sequence([
      Animated.spring(burst, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }),
      Animated.delay(300),
      Animated.timing(burst, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }

  // Dokunuş zamanı olay yükünden okunur; render saflığı korunur.
  function onMediaTap(event: GestureResponderEvent) {
    const now = event.nativeEvent.timestamp;
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      playBurst();
      if (!post.likedByMe && !like.isPending) like.mutate(post.id);
      return;
    }
    lastTapRef.current = now;
  }

  function openProfile() {
    if (!post.author?.username) return;
    router.push(`/customer/u/${post.author.username}` as never);
  }

  function submitComment() {
    const value = commentBody.trim();
    if (!value || createComment.isPending) return;
    createComment.mutate(
      { body: value },
      {
        onSuccess: () => {
          setCommentBody('');
          setShowComments(true);
        },
      },
    );
  }

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={openProfile} style={styles.headerIdentity}>
          {post.author?.avatarUrl ? (
            <Image
              source={{ uri: post.author.avatarUrl }}
              style={styles.avatar}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]} />
          )}
          <View style={styles.headerCopy}>
            <View style={styles.authorName}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {post.author?.displayName ?? `@${username}`}
              </Text>
              {post.author?.isVerifiedDisplay ? (
                <Text variant="caption" style={styles.verifiedMark}>
                  ✓
                </Text>
              ) : null}
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              @{username}
              {post.author?.kind === 'BUSINESS' ? ` · ${t('social.storeBadge')}` : ''}
              {dealish ? ` · ${t('social.dealBadge')}` : ''}
              {post.type === 'REQUEST_SHARE' ? ` · ${t('social.requestBadge')}` : ''}
              {post.type === 'REPOST' ? ` · ${t('social.repostedBy')}` : ''}
            </Text>
          </View>
        </Pressable>

        {post.author && !post.author.isFollowing ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => post.author && follow.mutate(post.author.username)}
            hitSlop={6}
          >
            <Text variant="caption" style={[styles.strong, { color: colors.accent }]}>
              {t('social.followCta')}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('social.moreActions')}
          onPress={() => setMenuOpen((open) => !open)}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.foregroundMuted} />
        </Pressable>
      </View>

      {menuOpen ? (
        <View style={[styles.menu, { borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              repost.mutate({ originalPostId: post.originalPostId ?? post.id });
              setMenuOpen(false);
            }}
          >
            <Text variant="caption">{t('social.repost')}</Text>
          </Pressable>
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
              accessibilityRole="button"
              onPress={() => {
                report.mutate({ targetType: 'POST', targetId: post.id, reason: t(key) });
                setMenuOpen(false);
              }}
            >
              <Text variant="caption" style={{ color: colors.danger }}>
                {t(key)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {image ? (
        <Pressable onPress={onMediaTap} style={[styles.mediaWrap, { height: mediaHeight }]}>
          <Image
            source={{ uri: image.url }}
            style={styles.media}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.burst,
              {
                opacity: burst,
                transform: [
                  { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.15] }) },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={96} color="#fff" />
          </Animated.View>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('social.like')}
          hitSlop={6}
          onPress={() => {
            if (post.likedByMe) {
              unlike.mutate(post.id);
              return;
            }
            playBurst();
            like.mutate(post.id);
          }}
        >
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={26}
            color={post.likedByMe ? colors.danger : colors.foreground}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('social.comment')}
          hitSlop={6}
          onPress={() => setShowComments((open) => !open)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.foreground} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('social.share')}
          hitSlop={6}
          onPress={() => share.mutate(post.id)}
        >
          <Ionicons
            name="paper-plane-outline"
            size={24}
            color={post.sharedByMe ? colors.brand : colors.foreground}
          />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('social.save')}
          hitSlop={6}
          onPress={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}
        >
          <Ionicons
            name={post.savedByMe ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={post.savedByMe ? colors.accent : colors.foreground}
          />
        </Pressable>
      </View>

      {(post.likeCount ?? 0) > 0 ? (
        <Text variant="bodyStrong" style={styles.gutter}>
          {t('social.likesCount', { count: post.likeCount ?? 0 })}
        </Text>
      ) : null}

      {body ? (
        <Text style={styles.gutter}>
          <Text variant="bodyStrong" onPress={openProfile}>
            {username}{' '}
          </Text>
          <Text>{caption}</Text>
          {longBody && !expanded ? (
            <Text tone="muted" onPress={() => setExpanded(true)}>
              {t('social.captionMore')}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <Text variant="caption" style={[styles.gutter, { color: colors.brand }]}>
          {tags.map((tag) => `#${tag}`).join('  ')}
        </Text>
      ) : null}

      {post.deal?.title || post.promo?.label ? (
        <Text variant="caption" style={[styles.gutter, { color: colors.accentOnSurface }]}>
          {post.deal?.title ?? post.promo?.label}
        </Text>
      ) : null}

      {(post.commentCount ?? 0) > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowComments((open) => !open)}
          style={styles.gutter}
        >
          <Text variant="caption" tone="muted">
            {t('social.viewAllComments', { count: post.commentCount ?? 0 })}
          </Text>
        </Pressable>
      ) : null}

      {showComments ? (
        <View style={[styles.gutter, styles.comments]}>
          {comments.data?.items.length ? (
            comments.data.items.map((comment) => (
              <Text key={comment.id} variant="caption">
                <Text variant="caption" style={styles.strong}>
                  {comment.author?.username ?? comment.author?.displayName ?? '—'}{' '}
                </Text>
                <Text variant="caption">{comment.body}</Text>
              </Text>
            ))
          ) : (
            <Text variant="caption" tone="muted">
              {t('social.commentEmpty')}
            </Text>
          )}
        </View>
      ) : null}

      <View style={[styles.composer, { borderTopColor: colors.border }]}>
        <TextInput
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder={t('social.addComment')}
          placeholderTextColor={colors.foregroundMuted}
          accessibilityLabel={t('social.commentsTitle')}
          returnKeyType="send"
          onSubmitEditing={submitComment}
          style={[styles.composerInput, typography.body, { color: colors.foreground }]}
        />
        <Pressable
          accessibilityRole="button"
          disabled={createComment.isPending || commentBody.trim().length === 0}
          onPress={submitComment}
          hitSlop={8}
        >
          <Text
            variant="bodyStrong"
            style={{ color: commentBody.trim() ? colors.brand : colors.foregroundMuted }}
          >
            {t('social.sendComment')}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingBottom: 0, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerCopy: { flex: 1 },
  authorName: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedMark: { color: '#16A34A' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  menu: { marginHorizontal: spacing.lg, gap: spacing.xs, paddingBottom: spacing.sm },
  mediaWrap: { width: '100%', justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  burst: { position: 'absolute', alignSelf: 'center' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  spacer: { flex: 1 },
  gutter: { paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  comments: { gap: spacing.xs },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  composerInput: { flex: 1, paddingVertical: spacing.sm },
  strong: { fontWeight: '700' },
});
