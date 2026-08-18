import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { EmptyState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useSocialMe, useFollowingList } from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import { useCreateGroupConversation } from './use-messages';

export function NewGroupScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const me = useSocialMe();
  const following = useFollowingList(me.data?.username ?? '', Boolean(me.data?.username));
  const create = useCreateGroupConversation();
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const people = (following.data?.items ?? []).filter((item) => item.userId);

  function toggle(userId: string) {
    setSelected((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  async function onSubmit() {
    setError(null);
    if (selected.length < 2) {
      setError(t('messaging.groupMinMembers'));
      return;
    }
    try {
      const conversation = await create.mutateAsync({
        title: title.trim() || t('messaging.newGroup'),
        memberIds: selected,
      });
      router.replace(`/${variant}/chat/${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('status.errorMessage'));
    }
  }

  return (
    <Screen>
      <Text variant="title">{t('messaging.newGroup')}</Text>
      <FormField
        label={t('messaging.groupTitle')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('messaging.groupTitlePlaceholder')}
      />
      <Text variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
        {t('messaging.groupMembers')}
      </Text>
      {following.isPending ? <ListSkeleton rows={3} /> : null}
      {people.length === 0 && following.isSuccess ? (
        <EmptyState title={t('messaging.groupEmpty')} />
      ) : null}
      {people.map((person) => {
        const userId = person.userId as string;
        const on = selected.includes(userId);
        return (
          <Pressable key={person.id} onPress={() => toggle(userId)} style={styles.row}>
            <View
              style={[
                styles.box,
                { borderColor: colors.border, backgroundColor: on ? colors.accent : 'transparent' },
              ]}
            />
            <Text variant="bodyStrong">{person.displayName}</Text>
          </Pressable>
        );
      })}
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={create.isPending ? t('messaging.creatingGroup') : t('messaging.createGroup')}
        loading={create.isPending}
        block
        onPress={() => void onSubmit()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  box: { width: 20, height: 20, borderWidth: 1, borderRadius: 4 },
});
