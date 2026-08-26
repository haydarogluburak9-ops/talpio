import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { SocialProfile } from '@talpio/types';

import { EmptyState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useFollowingList, useSearchProfiles, useSocialMe } from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme/tokens';

const MIN_QUERY_LENGTH = 2;

/** Arama kutusu; sorgu boşken takip edilenler önerilir. */
export function PeopleSearchInput({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const colors = useColors();

  return (
    <View style={[styles.search, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name="search" size={18} color={colors.foregroundMuted} />
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder={t('messaging.searchPeople')}
        placeholderTextColor={colors.foregroundMuted}
        accessibilityLabel={t('messaging.searchPeople')}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={[styles.searchInput, typography.body, { color: colors.foreground }]}
      />
      {query.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => onQueryChange('')}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.foregroundMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Arama sonuçlarını listeler.
 *
 * Grup üyeliği kullanıcı kimliği gerektirdiği için işletme profilleri
 * `requireUserId` ile elenir; doğrudan mesajda kullanıcı adı yeterlidir.
 */
export function PeopleResults({
  query,
  onSelect,
  selectedUserIds = [],
  disabledUserIds = [],
  requireUserId = false,
}: {
  query: string;
  onSelect: (profile: SocialProfile) => void;
  selectedUserIds?: string[];
  disabledUserIds?: string[];
  requireUserId?: boolean;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const me = useSocialMe();
  const following = useFollowingList(me.data?.username ?? '', Boolean(me.data?.username));
  const search = useSearchProfiles(query);

  const needle = query.trim();
  const isSearching = needle.length >= MIN_QUERY_LENGTH;
  const source = isSearching ? search.data?.items : following.data?.items;
  const people = (source ?? []).filter((person) => !requireUserId || Boolean(person.userId));
  const isPending = isSearching ? search.isPending : following.isPending;

  if (isPending) return <ListSkeleton rows={3} />;

  if (people.length === 0) {
    return (
      <EmptyState
        icon="people-outline"
        title={isSearching ? t('messaging.searchEmpty') : t('messaging.groupEmpty')}
      />
    );
  }

  return (
    <View>
      <Text variant="caption" tone="muted" style={styles.sectionLabel}>
        {isSearching ? t('messaging.searchPeople') : t('messaging.suggestedPeople')}
      </Text>

      {people.map((person) => {
        const userId = person.userId ?? '';
        const isDisabled = disabledUserIds.includes(userId);
        const isSelected = selectedUserIds.includes(userId);

        return (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, selected: isSelected }}
            disabled={isDisabled}
            onPress={() => onSelect(person)}
            style={[styles.row, isDisabled && styles.rowDisabled]}
          >
            {person.avatarUrl ? (
              <Image source={{ uri: person.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surfaceMuted }]}>
                <Text variant="caption" tone="muted">
                  {person.displayName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.rowBody}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {person.displayName}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                @{person.username}
                {isDisabled ? ` · ${t('messaging.memberAlreadyIn')}` : ''}
              </Text>
            </View>

            {isSelected ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm },
  sectionLabel: { marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  rowDisabled: { opacity: 0.5 },
  rowBody: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
});
