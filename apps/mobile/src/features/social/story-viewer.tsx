import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MESSAGE } from '@talpio/config';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useMessageProfile, useSendMessage } from '@/features/messages/use-messages';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import type { StoryGroup } from './story-helpers';

const STORY_MS = 5500;
const SWIPE_THRESHOLD = 60;
const TAP_SLOP = 14;

/**
 * Tam ekran hikâye görüntüleyici.
 *
 * `startGroup` yalnızca ilk konumu belirler. Farklı bir gruptan başlatmak için
 * çağıran taraf `key={startGroup}` verir; bileşen o zaman baştan kurulur ve
 * ilerleme durumu doğal olarak sıfırlanır.
 */
export function StoryViewer({
  groups,
  startGroup,
  meId,
  onClose,
}: {
  groups: StoryGroup[];
  startGroup: number;
  meId?: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const [groupIndex, setGroupIndex] = useState(startGroup);
  const [itemIndex, setItemIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  const group = groups[groupIndex];
  const post = group?.posts[itemIndex];
  const postId = post?.id;
  const media = post?.media[0];
  const authorUsername = group?.author.username;
  const isOwnStory = Boolean(meId && group?.author.id === meId);
  const canReply = Boolean(authorUsername && !isOwnStory);

  const openMessage = useMessageProfile();
  const send = useSendMessage(conversationId ?? '');

  const goNext = useCallback(() => {
    const currentGroup = groups[groupIndex];
    if (!currentGroup) return;

    if (itemIndex + 1 < currentGroup.posts.length) {
      setItemIndex((value) => value + 1);
      setPlayKey((value) => value + 1);
      return;
    }
    if (groupIndex + 1 < groups.length) {
      setGroupIndex((value) => value + 1);
      setItemIndex(0);
      setPlayKey((value) => value + 1);
      return;
    }
    onClose();
  }, [groupIndex, groups, itemIndex, onClose]);

  const goPrev = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((value) => value - 1);
      setPlayKey((value) => value + 1);
      return;
    }
    if (groupIndex > 0) {
      const prev = groups[groupIndex - 1];
      setGroupIndex((value) => value - 1);
      setItemIndex(Math.max(0, (prev?.posts.length ?? 1) - 1));
      setPlayKey((value) => value + 1);
    }
  }, [groupIndex, groups, itemIndex]);

  const replayCurrent = useCallback(() => {
    setItemIndex(0);
    setPlayKey((value) => value + 1);
  }, []);

  const openMessageSheet = useCallback(async () => {
    if (!canReply || !authorUsername) return;
    setPaused(true);
    setMessageOpen(true);
    try {
      const conversation = await openMessage.mutateAsync(authorUsername);
      setConversationId(conversation.id);
    } catch {
      setMessageOpen(false);
      setPaused(false);
    }
  }, [canReply, authorUsername, openMessage]);

  const handleInteractionEnd = useCallback(
    (dx: number, dy: number, x: number) => {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < TAP_SLOP && absY < TAP_SLOP) {
        if (x < screenWidth / 2) replayCurrent();
        else goNext();
        return;
      }

      if (absY > absX) {
        if (dy > SWIPE_THRESHOLD) onClose();
        else if (dy < -SWIPE_THRESHOLD && canReply) void openMessageSheet();
        return;
      }

      if (dx > SWIPE_THRESHOLD) goNext();
      else if (dx < -SWIPE_THRESHOLD) goPrev();
    },
    [canReply, goNext, goPrev, onClose, openMessageSheet, replayCurrent, screenWidth],
  );

  function closeMessageSheet() {
    setMessageOpen(false);
    setDraft('');
    setPaused(false);
  }

  function submitReply() {
    const body = draft.trim();
    if (!body || !conversationId || send.isPending) return;

    send.mutate(
      { body, clientMessageId: `${conversationId}-story-${Date.now()}` },
      {
        onSuccess: () => {
          setDraft('');
          setMessageOpen(false);
          setPaused(false);
        },
      },
    );
  }

  // playKey her ilerlemede artar; sayaç aynı karede yeniden kurulur.
  useEffect(() => {
    if (!postId || paused || messageOpen) return;
    const timer = setTimeout(goNext, STORY_MS);
    return () => clearTimeout(timer);
  }, [postId, paused, messageOpen, playKey, goNext]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(8)
        .onEnd((event) => {
          runOnJS(handleInteractionEnd)(event.translationX, event.translationY, event.x);
        }),
    [handleInteractionEnd],
  );

  if (!group || !post) return null;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.modalRoot}>
        <GestureDetector gesture={panGesture}>
          <View style={[styles.root, { backgroundColor: colors.brand, paddingTop: insets.top + 8 }]}>
          <View style={styles.bars}>
            {group.posts.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.bar,
                  { backgroundColor: index <= itemIndex ? '#fff' : 'rgba(255,255,255,0.35)' },
                ]}
              />
            ))}
          </View>

          <Text variant="bodyStrong" style={styles.name}>
            {group.author.displayName}
          </Text>

          {media?.url ? (
            <Image source={{ uri: media.url }} style={styles.media} resizeMode="contain" />
          ) : (
            <Text style={styles.body}>{post.body}</Text>
          )}

          {canReply && !messageOpen ? (
            <Text variant="caption" style={styles.replyHint}>
              {t('social.storyReplyHint')}
            </Text>
          ) : null}

          {messageOpen ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.replySheet, { paddingBottom: insets.bottom + spacing.sm }]}
            >
              <Text variant="caption" style={styles.replyLabel}>
                {t('social.storyReplyTo', { name: group.author.displayName })}
              </Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                autoFocus
                multiline
                maxLength={MESSAGE.maxBodyLength}
                placeholder={t('social.storyReplyPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.replyInput}
              />
              <View style={styles.replyActions}>
                <Button label={t('common.cancel')} variant="ghost" onPress={closeMessageSheet} />
                <Button
                  label={t('messaging.send')}
                  onPress={submitReply}
                  disabled={!draft.trim() || !conversationId || send.isPending || openMessage.isPending}
                  loading={send.isPending}
                />
              </View>
            </KeyboardAvoidingView>
          ) : null}
        </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  root: { flex: 1, paddingHorizontal: spacing.md },
  bars: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  name: { color: '#fff', marginBottom: spacing.md },
  media: { flex: 1, width: '100%' },
  body: { color: '#fff', fontSize: 18, padding: spacing.lg, flex: 1 },
  replyHint: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.65)',
  },
  replySheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  replyLabel: { color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm },
  replyInput: {
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
