import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import type { StoryGroup } from './story-helpers';

const STORY_MS = 5500;

export function StoryViewer({
  groups,
  startGroup,
  onClose,
}: {
  groups: StoryGroup[];
  startGroup: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const [groupIndex, setGroupIndex] = useState(startGroup);
  const [itemIndex, setItemIndex] = useState(0);
  const group = groups[groupIndex];
  const post = group?.posts[itemIndex];
  const media = post?.media[0];

  useEffect(() => {
    setGroupIndex(startGroup);
    setItemIndex(0);
  }, [startGroup]);

  function goNext() {
    if (!group) return;
    if (itemIndex + 1 < group.posts.length) {
      setItemIndex((current) => current + 1);
      return;
    }
    if (groupIndex + 1 < groups.length) {
      setGroupIndex((current) => current + 1);
      setItemIndex(0);
      return;
    }
    onClose();
  }

  function goPrev() {
    if (itemIndex > 0) {
      setItemIndex((current) => current - 1);
      return;
    }
    if (groupIndex > 0) {
      const prev = groups[groupIndex - 1];
      setGroupIndex((current) => current - 1);
      setItemIndex(Math.max(0, (prev?.posts.length ?? 1) - 1));
      return;
    }
    onClose();
  }

  useEffect(() => {
    if (!post) return;
    const timer = setTimeout(goNext, STORY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, itemIndex, post?.id]);

  if (!group || !post) return null;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.brand }]}>
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
        <View style={styles.hit}>
          <Pressable accessibilityLabel={t('social.prevStory')} style={styles.half} onPress={goPrev} />
          <Pressable accessibilityLabel={t('social.nextStory')} style={styles.half} onPress={goNext} />
        </View>
        <Pressable accessibilityLabel={t('social.closeStory')} onPress={onClose} style={styles.close}>
          <Text style={{ color: '#fff' }}>{t('common.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 48, paddingHorizontal: spacing.md },
  bars: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  name: { color: '#fff', marginBottom: spacing.md },
  media: { flex: 1, width: '100%' },
  body: { color: '#fff', fontSize: 18, padding: spacing.lg },
  hit: { ...StyleSheet.absoluteFill, flexDirection: 'row', top: 80 },
  half: { flex: 1 },
  close: { position: 'absolute', top: 48, right: spacing.md, zIndex: 2 },
});
