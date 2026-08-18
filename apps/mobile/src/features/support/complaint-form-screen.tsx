import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ComplaintSubjectType } from '@talpio/types';
import { createComplaintSchema } from '@talpio/validation';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useCreateComplaint } from './use-support';

export function ComplaintFormScreen({
  subjectType = ComplaintSubjectType.USER,
  subjectId,
}: {
  subjectType?: ComplaintSubjectType;
  subjectId: string;
}) {
  const { t } = useI18n();
  const create = useCreateComplaint();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = () => {
    setError(null);
    const parsed = createComplaintSchema.safeParse({
      subjectType,
      subjectId,
      reason,
      description: description.trim() || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('complaint.submitFailed'));
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: () => {
        setDone(true);
        setReason('');
        setDescription('');
      },
      onError: () => setError(t('complaint.submitFailed')),
    });
  };

  if (done) {
    return (
      <Screen>
        <Text variant="body">{t('complaint.submitted')}</Text>
        <Button
          label={t('complaint.createTitle')}
          variant="outline"
          block
          onPress={() => setDone(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FormField
        label={t('complaint.reason')}
        value={reason}
        onChangeText={setReason}
        placeholder={t('complaint.reasonPlaceholder')}
        maxLength={120}
      />
      <FormField
        label={t('complaint.description')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('complaint.descriptionPlaceholder')}
        multiline
        style={styles.body}
        maxLength={2000}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={create.isPending ? t('complaint.submitting') : t('complaint.submit')}
        loading={create.isPending}
        block
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { minHeight: 120, textAlignVertical: 'top', marginBottom: spacing.sm },
});
