import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { SocialPost } from '@talpio/types';

import { Text } from '@/components/text';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import {
  getDiscoverPostPreview,
  getDiscoverPostThumbnail,
  isDiscoverPostVideo,
} from './discover-post-media';

const GAP = 2;
const COLUMNS = 3;

/**
 * Instagram tarzı kare ızgara. Ekran kabuğu zaten kaydırılabilir olduğu için
 * FlatList yerine sarmalayan View kullanılır; iç içe liste uyarısı oluşmaz.
 */
export function DiscoverGrid({
  posts,
  onSelect,
}: {
  posts: SocialPost[];
  onSelect: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const available = width - spacing.lg * 2 - GAP * (COLUMNS - 1);
  const tileSize = Math.floor(available / COLUMNS);

  return (
    <View style={styles.grid}>
      {posts.map((post, index) => (
        <DiscoverGridTile
          key={post.id}
          post={post}
          size={tileSize}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}

function DiscoverGridTile({
  post,
  size,
  onPress,
}: {
  post: SocialPost;
  size: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const thumbnail = getDiscoverPostThumbnail(post);
  const preview = getDiscoverPostPreview(post);
  const isVideo = isDiscoverPostVideo(post);
  const multi = post.media.length > 1;

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={preview}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width: size, height: size, backgroundColor: colors.surfaceMuted },
        pressed && styles.pressed,
      ]}
    >
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.image} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.fallback, { backgroundColor: colors.brand }]}>
          <Text variant="caption" style={styles.preview} numberOfLines={5}>
            {preview}
          </Text>
          {post.author ? (
            <Text variant="caption" style={styles.previewAuthor} numberOfLines={1}>
              @{post.author.username}
            </Text>
          ) : null}
        </View>
      )}

      {multi || isVideo ? (
        <View style={styles.badge}>
          <Ionicons name={isVideo ? 'videocam' : 'copy-outline'} size={14} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { overflow: 'hidden', borderRadius: 2 },
  pressed: { opacity: 0.88 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallback: {
    flex: 1,
    padding: spacing.xs,
    justifyContent: 'space-between',
    opacity: 0.92,
  },
  preview: { color: '#fff', fontSize: 11, lineHeight: 15 },
  previewAuthor: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
});
