import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { SocialProfile } from '@talpio/types';

import { EmptyState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme/tokens';

/**
 * Takipçi / takip edilen listesi.
 *
 * Sayı üstte, liste altında durur. Arama kutusu yüklü kayıtlar üzerinde
 * çalışır; her sekme kendi bileşenini kurduğu için aramalar birbirine
 * karışmaz.
 */
export function ProfileGraphList({
  pending,
  items,
  totalCount,
  countLabel,
  searchLabel,
  variant,
}: {
  pending: boolean;
  items: SocialProfile[];
  totalCount: number;
  countLabel: string;
  searchLabel: string;
  variant: 'customer' | 'provider';
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLocaleLowerCase();
  const visible =
    needle.length === 0
      ? items
      : items.filter(
          (person) =>
            person.displayName.toLocaleLowerCase().includes(needle) ||
            person.username.toLocaleLowerCase().includes(needle),
        );

  return (
    <View style={styles.wrap}>
      <Text variant="bodyStrong">{countLabel}</Text>

      <View style={[styles.search, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="search" size={18} color={colors.foregroundMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchLabel}
          placeholderTextColor={colors.foregroundMuted}
          accessibilityLabel={searchLabel}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[styles.searchInput, typography.body, { color: colors.foreground }]}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => setQuery('')}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.foregroundMuted} />
          </Pressable>
        ) : null}
      </View>

      {pending ? (
        <ListSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={needle.length > 0 ? t('social.graphSearchEmpty') : t('social.emptyGraph')}
        />
      ) : (
        visible.map((person) => (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            onPress={() => router.push(`/${variant}/u/${person.username}` as never)}
            style={styles.row}
          >
            {person.avatarUrl ? (
              <Image source={{ uri: person.avatarUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surfaceMuted }]}
              >
                <Text variant="caption" tone="muted">
                  {person.displayName.slice(0, 2).toLocaleUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.rowBody}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {person.displayName}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                @{person.username}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  rowBody: { flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
});
