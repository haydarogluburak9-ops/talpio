'use client';

import { ComplaintSubjectType } from '@talpio/types';
import { createComplaintSchema } from '@talpio/validation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Textarea,
} from '@talpio/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { useCreateComplaint } from './use-support';

export function ComplaintForm({
  subjectType = ComplaintSubjectType.USER,
  subjectId,
}: {
  subjectType?: ComplaintSubjectType;
  subjectId: string;
}) {
  const create = useCreateComplaint();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
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

    try {
      await create.mutateAsync(parsed.data);
      setDone(true);
      setReason('');
      setDescription('');
    } catch {
      setError(t('complaint.submitFailed'));
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-foreground">{t('complaint.submitted')}</p>
          <Button className="mt-4" variant="outline" onClick={() => setDone(false)}>
            {t('complaint.createTitle')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('complaint.createTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
          <Field label={t('complaint.reason')} required>
            {(props) => (
              <Input
                {...props}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('complaint.reasonPlaceholder')}
                maxLength={120}
              />
            )}
          </Field>

          <Field label={t('complaint.description')}>
            {(props) => (
              <Textarea
                {...props}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('complaint.descriptionPlaceholder')}
                rows={4}
                maxLength={2000}
              />
            )}
          </Field>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t('complaint.submitting') : t('complaint.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
