import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import type { SocialProfile } from '@talpio/types';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { groupStories } from './story-helpers';
import { StoryViewer } from './story-viewer';
import { useSocialMe } from './use-social';

type ViewerState = { kind: 'active' } | { kind: 'highlight'; highlightId: string } | null;

export function ProfileHighlightsSection({
  profile,
}: {
  profile: SocialProfile;
}) {
  const { t } = useI18n();
  const me = useSocialMe(true);
  const isOwn = me.data?.id === profile.id;
  const [viewer, setViewer] = useState<ViewerState>(null);

  const activeStories = useQuery({
    queryKey: queryKeys.social.profileStories(profile.username),
    queryFn: ({ signal }) => apiClient.social.listProfileStories(profile.username, signal),
  });

  const highlights = useQuery({
    queryKey: queryKeys.social.profileHighlights(profile.username),
    queryFn: ({ signal }) => apiClient.social.listProfileHighlights(profile.username, signal),
  });

  const highlightDetail = useQuery({
    queryKey:
      viewer?.kind === 'highlight'
        ? queryKeys.social.profileHighlight(profile.username, viewer.highlightId)
        : ['social', 'profile-highlight', 'idle'],
    queryFn: ({ signal }) => {
      if (viewer?.kind !== 'highlight') {
        throw new Error('Highlight viewer inactive');
      }
      return apiClient.social.getProfileHighlight(profile.username, viewer.highlightId, signal);
    },
    enabled: viewer?.kind === 'highlight',
  });

  const activeItems = activeStories.data?.items ?? [];
  const highlightItems = highlights.data?.items ?? [];
  const hasActive = activeItems.length > 0;
  const hasHighlights = highlightItems.length > 0;

  const viewerGroups = useMemo(() => {
    if (viewer?.kind === 'active') return groupStories(activeItems, profile.id);
    if (viewer?.kind === 'highlight' && highlightDetail.data?.items.length) {
      return [{ author: profile, posts: highlightDetail.data.items }];
    }
    return [];
  }, [viewer, activeItems, highlightDetail.data?.items, profile]);

  if (!hasActive && !hasHighlights) return null;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
        {hasActive ? (
          <HighlightChip
            title={isOwn ? t('social.yourStory') : t('social.storiesTitle')}
            coverUrl={profile.avatarUrl}
            ring
            onPress={() => setViewer({ kind: 'active' })}
          />
        ) : null}
        {highlightItems.map((item) => (
          <HighlightChip
            key={item.id}
            title={item.title}
            coverUrl={item.coverUrl}
            onPress={() => setViewer({ kind: 'highlight', highlightId: item.id })}
          />
        ))}
      </ScrollView>

      {viewer && viewerGroups.length > 0 ? (
        <StoryViewer
          groups={viewerGroups}
          startGroup={0}
          meId={me.data?.id}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </>
  );
}

function HighlightChip({
  title,
  coverUrl,
  ring,
  onPress,
}: {
  title: string;
  coverUrl?: string | null;
  ring?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <View style={[styles.circleOuter, ring ? styles.ring : styles.border]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.circleImage} />
        ) : (
          <View style={styles.circleFallback}>
            <Text variant="caption">{title.slice(0, 1)}</Text>
          </View>
        )}
      </View>
      <Text variant="caption" numberOfLines={2} style={styles.label}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: { marginTop: spacing.md },
  chip: { width: 76, alignItems: 'center', marginRight: spacing.sm },
  circleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 2, borderColor: '#f97316' },
  border: { borderWidth: 1, borderColor: '#cbd5e1' },
  circleImage: { width: '100%', height: '100%', borderRadius: 32 },
  circleFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  label: { marginTop: 6, textAlign: 'center' },
});
