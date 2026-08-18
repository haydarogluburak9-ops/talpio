import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { createSupportTicketSchema } from '@talpio/validation';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useCreateSupportTicket } from './use-support';

export function TicketFormScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const router = useRouter();
  const create = useCreateSupportTicket();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const parsed = createSupportTicketSchema.safeParse({
      subject,
      body,
      attachmentFileIds: [],
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('support.submitFailed'));
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: (ticket) => router.replace(`/${variant}/support/${ticket.id}`),
      onError: () => setError(t('support.submitFailed')),
    });
  };

  return (
    <Screen>
      <FormField
        label={t('support.subject')}
        value={subject}
        onChangeText={setSubject}
        placeholder={t('support.subjectPlaceholder')}
        maxLength={160}
      />
      <FormField
        label={t('support.body')}
        value={body}
        onChangeText={setBody}
        placeholder={t('support.bodyPlaceholder')}
        multiline
        style={styles.body}
        maxLength={4000}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={create.isPending ? t('support.submitting') : t('support.submit')}
        loading={create.isPending}
        block
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { minHeight: 140, textAlignVertical: 'top', marginBottom: spacing.sm },
});
