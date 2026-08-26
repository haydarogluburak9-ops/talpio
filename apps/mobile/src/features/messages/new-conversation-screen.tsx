import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';
import type { SocialProfile } from '@talpio/types';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import { PeopleResults, PeopleSearchInput } from './people-picker';
import { useCreateGroupConversation, useMessageProfile } from './use-messages';

type Mode = 'direct' | 'group';

/**
 * Yeni sohbet ekranı.
 *
 * Varsayılan akış tek kişiye yazmaktır; grup moduna geçildiğinde aynı arama
 * listesi çoklu seçime döner ve bir grup adı istenir.
 */
export function NewConversationScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const startDirect = useMessageProfile();
  const createGroup = useCreateGroupConversation();

  const [mode, setMode] = useState<Mode>('direct');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<SocialProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  function onSelect(profile: SocialProfile) {
    setError(null);

    if (mode === 'group') {
      setSelected((current) =>
        current.some((item) => item.id === profile.id)
          ? current.filter((item) => item.id !== profile.id)
          : [...current, profile],
      );
      return;
    }

    startDirect.mutate(profile.username, {
      onSuccess: (conversation) => router.replace(`/${variant}/chat/${conversation.id}`),
      onError: (err) => setError(err instanceof ApiError ? err.message : t('status.errorMessage')),
    });
  }

  function onCreateGroup() {
    setError(null);
    if (selected.length < 2) {
      setError(t('messaging.groupMinMembers'));
      return;
    }

    createGroup.mutate(
      {
        title: title.trim() || t('messaging.newGroup'),
        memberIds: selected
          .map((person) => person.userId)
          .filter((id): id is string => Boolean(id)),
      },
      {
        onSuccess: (conversation) => router.replace(`/${variant}/chat/${conversation.id}`),
        onError: (err) => setError(err instanceof ApiError ? err.message : t('status.errorMessage')),
      },
    );
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text variant="title">
          {mode === 'direct' ? t('messaging.newMessage') : t('messaging.newGroup')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode(mode === 'direct' ? 'group' : 'direct');
            setSelected([]);
            setError(null);
          }}
          hitSlop={8}
        >
          <Text variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
            {mode === 'direct' ? t('messaging.switchToGroup') : t('messaging.switchToDirect')}
          </Text>
        </Pressable>
      </View>

      {mode === 'group' ? (
        <FormField
          label={t('messaging.groupTitle')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('messaging.groupTitlePlaceholder')}
        />
      ) : null}

      <PeopleSearchInput query={query} onQueryChange={setQuery} />

      <PeopleResults
        query={query}
        onSelect={onSelect}
        selectedUserIds={selected
          .map((person) => person.userId)
          .filter((id): id is string => Boolean(id))}
        requireUserId={mode === 'group'}
      />

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}

      {mode === 'group' ? (
        <View style={styles.footer}>
          <Text variant="caption" tone="muted">
            {t('messaging.selectedCount', { count: selected.length })}
          </Text>
          <Button
            label={createGroup.isPending ? t('messaging.creatingGroup') : t('messaging.createGroup')}
            loading={createGroup.isPending}
            block
            onPress={onCreateGroup}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footer: { gap: spacing.sm, marginTop: spacing.md },
});
