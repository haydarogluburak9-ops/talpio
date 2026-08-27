import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useSession } from '@/features/auth/session-provider';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import { groupStories } from './story-helpers';
import { StoryComposer } from './story-composer';
import { StoryViewer } from './story-viewer';
import { useSocialMe, useStories } from './use-social';

export function StoriesRail() {
  const { t } = useI18n();
  const colors = useColors();
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  const me = useSocialMe(loggedIn);
  const stories = useStories(loggedIn);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  const groups = useMemo(
    () => groupStories(stories.data?.items ?? [], me.data?.id),
    [stories.data?.items, me.data?.id],
  );
  const mineIndex = groups.findIndex((group) => group.author.id === me.data?.id);

  if (!loggedIn) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="muted" style={styles.heading}>
        {t('social.storiesTitle')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Pressable
          accessibilityLabel={t('social.addStory')}
          onPress={() => {
            if (mineIndex >= 0) setOpenIndex(mineIndex);
            else setComposing(true);
          }}
          style={styles.item}
        >
          <View style={[styles.ring, { borderColor: colors.accent }]}>
            {me.data?.avatarUrl ? (
              <Image source={{ uri: me.data.avatarUrl }} style={styles.avatar} />
            ) : (
              <Text variant="bodyStrong">{(me.data?.displayName ?? 'T').slice(0, 1)}</Text>
            )}
            <Pressable
              accessibilityLabel={t('social.addStory')}
              onPress={() => setComposing(true)}
              style={[styles.plus, { backgroundColor: colors.accent }]}
            >
              <Text variant="caption" style={styles.plusLabel}>
                +
              </Text>
            </Pressable>
          </View>
          <Text variant="caption" numberOfLines={2} style={styles.label}>
            {t('social.yourStory')}
          </Text>
        </Pressable>
        {groups
          .map((group, index) => ({ group, index }))
          .filter(({ group }) => group.author.id !== me.data?.id)
          .map(({ group, index }) => {
            const preview = group.posts[group.posts.length - 1]?.media[0]?.url;
            return (
              <Pressable
                key={group.author.id}
                onPress={() => setOpenIndex(index)}
                style={styles.item}
              >
                <View style={[styles.ring, { borderColor: colors.accent }]}>
                  {preview || group.author.avatarUrl ? (
                    <Image
                      source={{ uri: group.author.avatarUrl ?? preview }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Text variant="bodyStrong">{group.author.displayName.slice(0, 1)}</Text>
                  )}
                </View>
                <Text variant="caption" numberOfLines={2} style={styles.label}>
                  {group.author.displayName}
                </Text>
              </Pressable>
            );
          })}
      </ScrollView>
      {groups.length === 0 && !stories.isPending ? (
        <Text variant="caption" tone="muted">
          {t('social.storiesEmpty')}
        </Text>
      ) : null}
      {composing ? <StoryComposer onDone={() => setComposing(false)} /> : null}
      {openIndex != null && groups[openIndex] ? (
        <StoryViewer
          key={openIndex}
          groups={groups}
          startGroup={openIndex}
          meId={me.data?.id}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  heading: { marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  item: { width: 76, alignItems: 'center', marginRight: spacing.sm },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'visible',
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  plus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLabel: { color: '#fff', fontWeight: '700' },
  label: { textAlign: 'center' },
});
