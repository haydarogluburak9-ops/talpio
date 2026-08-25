import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SocialPost } from '@talpio/types';

import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { PostCard } from './post-card';

/**
 * Izgaradan seçilen gönderiyi tam ekran açar; dikey kaydırma ile
 * diğer gönderilere geçilir (Instagram davranışı).
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
          // initialScrollIndex ölçüm gecikmesinde hedefe elle kaydırılır.
          onScrollToIndexFailed={({ index }) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({ offset: pageHeight * index, animated: false });
            });
          }}
          renderItem={({ item }) => (
            <View style={{ height: pageHeight }}>
              <ScrollView
                contentContainerStyle={[
                  styles.page,
                  { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <PostCard post={item} mediaHeight={Math.round(pageHeight * 0.45)} />
              </ScrollView>
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
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  close: {
    position: 'absolute',
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
