import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  type GestureResponderEvent,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SocialPost } from '@talpio/types';

import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme/tokens';

import {
  useCreateComment,
  useFollow,
  useLikePost,
  usePostComments,
  useSavePost,
  useSharePost,
  useUnlikePost,
  useUnsavePost,
} from './use-social';

const DOUBLE_TAP_MS = 300;
const CAPTION_LIMIT = 140;

/** Instagram görüntüleyicisi tamamen koyu zeminde çalışır. */
const INK = {
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.65)',
  line: 'rgba(255,255,255,0.12)',
  chip: 'rgba(255,255,255,0.1)',
  like: '#ff3040',
  link: '#7cc0ff',
};

/**
 * Izgaradan seçilen gönderiyi tam ekran açar; dikey kaydırma diğer
 * gönderilere geçer, çift dokunuş beğenir (Instagram davranışı).
 */
export function DiscoverViewer({
  posts,
  startIndex,
  onClose,
}: {
  posts: SocialPost[];
  startIndex: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const listRef = useRef<FlatList<SocialPost>>(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);

  const pageHeight = height;

  const getItemLayout = useCallback(
    (_data: ArrayLike<SocialPost> | null | undefined, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight],
  );

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.y / pageHeight);
            setActiveIndex((current) => (current === next ? current : next));
          }}
          // initialScrollIndex ölçüm gecikmesinde hedefe elle kaydırılır.
          onScrollToIndexFailed={({ index }) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({ offset: pageHeight * index, animated: false });
            });
          }}
          renderItem={({ item, index }) => (
            <View style={{ height: pageHeight }}>
              <ViewerPost
                post={item}
                active={Math.abs(index - activeIndex) <= 1}
                topInset={insets.top}
                bottomInset={insets.bottom}
                onClose={onClose}
              />
            </View>
          )}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.close, { top: insets.top + spacing.sm }]}
        >
          <Ionicons name="close" size={24} color={INK.text} />
        </Pressable>
      </View>
    </Modal>
  );
}

function ViewerPost({
  post,
  active,
  topInset,
  bottomInset,
  onClose,
}: {
  post: SocialPost;
  active: boolean;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const share = useSharePost();
  const follow = useFollow();
  const comments = usePostComments(post.id, active);
  const createComment = useCreateComment(post.id);

  const [commentBody, setCommentBody] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [slide, setSlide] = useState(0);
  const lastTapRef = useRef(0);
  const composerRef = useRef<TextInput>(null);
  const [burst] = useState(() => new Animated.Value(0));

  const media = post.media ?? [];
  const body = post.body ?? '';
  const longBody = body.length > CAPTION_LIMIT;
  const caption = expanded || !longBody ? body : `${body.slice(0, CAPTION_LIMIT).trimEnd()}… `;
  const username = post.author?.username ?? '—';
  const mediaHeight = Math.min(width, 520);

  function playBurst() {
    burst.setValue(0);
    Animated.sequence([
      Animated.spring(burst, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }),
      Animated.delay(320),
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
    onClose();
    router.push(`/customer/u/${post.author.username}` as never);
  }

  function submitComment() {
    const value = commentBody.trim();
    if (!value || createComment.isPending) return;
    createComment.mutate({ body: value }, { onSuccess: () => setCommentBody('') });
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <Pressable accessibilityRole="button" onPress={openProfile} style={styles.headerIdentity}>
          {post.author?.avatarUrl ? (
            <Image
              source={{ uri: post.author.avatarUrl }}
              style={styles.avatar}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text variant="overline" style={{ color: INK.text }}>
                {(post.author?.displayName ?? 'T').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerCopy}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ color: INK.text }}>
              @{username}
            </Text>
            {post.author?.locationText ? (
              <Text variant="caption" numberOfLines={1} style={{ color: INK.muted }}>
                {post.author.locationText}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {post.author && !post.author.isFollowing ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => post.author && follow.mutate(post.author.username)}
            style={styles.followChip}
          >
            <Text variant="caption" style={styles.strongInk}>
              {t('social.followCta')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onMediaTap} style={[styles.mediaWrap, { height: mediaHeight }]}>
          {media.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setSlide(Math.round(event.nativeEvent.contentOffset.x / width))
              }
            >
              {media.map((file) => (
                <Image
                  key={file.id}
                  source={{ uri: file.url }}
                  style={{ width, height: mediaHeight }}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.textOnlyBody}>{body}</Text>
          )}

          {media.length > 1 ? (
            <View style={styles.dots}>
              {media.map((file, position) => (
                <View
                  key={file.id}
                  style={[styles.dot, position === slide ? styles.dotActive : null]}
                />
              ))}
            </View>
          ) : null}

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
            <Ionicons name="heart" size={110} color={INK.text} />
          </Animated.View>
        </Pressable>

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
              size={28}
              color={post.likedByMe ? INK.like : INK.text}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('social.comment')}
            hitSlop={6}
            onPress={() => composerRef.current?.focus()}
          >
            <Ionicons name="chatbubble-outline" size={26} color={INK.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('social.share')}
            hitSlop={6}
            onPress={() => share.mutate(post.id)}
          >
            <Ionicons name="paper-plane-outline" size={26} color={INK.text} />
          </Pressable>
          <View style={styles.actionsSpacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('social.save')}
            hitSlop={6}
            onPress={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}
          >
            <Ionicons
              name={post.savedByMe ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={INK.text}
            />
          </Pressable>
        </View>

        <Text variant="bodyStrong" style={[styles.gutter, { color: INK.text }]}>
          {t('social.likesCount', { count: post.likeCount ?? 0 })}
        </Text>

        {body ? (
          <Text style={[styles.gutter, styles.caption]}>
            <Text variant="bodyStrong" style={{ color: INK.text }} onPress={openProfile}>
              {username}{' '}
            </Text>
            <Text style={{ color: INK.text }}>{caption}</Text>
            {longBody && !expanded ? (
              <Text style={{ color: INK.muted }} onPress={() => setExpanded(true)}>
                {t('social.captionMore')}
              </Text>
            ) : null}
          </Text>
        ) : null}

        {(post.hashtags ?? []).length > 0 ? (
          <Text variant="caption" style={[styles.gutter, styles.caption, { color: INK.link }]}>
            {(post.hashtags ?? []).map((tag) => `#${tag}`).join('  ')}
          </Text>
        ) : null}

        <View style={[styles.gutter, styles.comments]}>
          {comments.data?.items.length ? (
            comments.data.items.map((comment) => (
              <Text key={comment.id} variant="caption" style={styles.commentRow}>
                <Text variant="caption" style={styles.strongInk}>
                  {comment.author?.username ?? comment.author?.displayName ?? '—'}{' '}
                </Text>
                <Text variant="caption" style={{ color: INK.text }}>
                  {comment.body}
                </Text>
              </Text>
            ))
          ) : (
            <Text variant="caption" style={{ color: INK.muted }}>
              {t('social.commentEmpty')}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: bottomInset + spacing.sm }]}>
        <TextInput
          ref={composerRef}
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder={t('social.addComment')}
          placeholderTextColor={INK.muted}
          accessibilityLabel={t('social.commentsTitle')}
          style={[styles.composerInput, typography.body]}
          returnKeyType="send"
          onSubmitEditing={submitComment}
        />
        <Pressable
          accessibilityRole="button"
          disabled={createComment.isPending || commentBody.trim().length === 0}
          onPress={submitComment}
          hitSlop={8}
        >
          <Text
            variant="bodyStrong"
            style={{ color: commentBody.trim() ? INK.link : INK.muted }}
          >
            {t('social.sendComment')}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  page: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingRight: MIN_TOUCH_TARGET + spacing.lg,
  },
  headerIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerCopy: { flex: 1 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: INK.chip },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  followChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: INK.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  scroll: { flex: 1 },
  mediaWrap: { width: '100%', justifyContent: 'center', backgroundColor: '#000' },
  textOnlyBody: {
    color: INK.text,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: INK.text },
  burst: { position: 'absolute', alignSelf: 'center' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  actionsSpacer: { flex: 1 },
  gutter: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  caption: { color: INK.text },
  comments: { gap: spacing.xs },
  commentRow: { color: INK.text },
  strongInk: { color: INK.text, fontWeight: '700' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: INK.line,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  composerInput: { flex: 1, color: INK.text, paddingVertical: spacing.sm },
  close: {
    position: 'absolute',
    right: spacing.md,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
