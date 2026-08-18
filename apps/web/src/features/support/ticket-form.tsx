'use client';

import { createSupportTicketSchema } from '@talpio/validation';
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { useCreateSupportTicket } from './use-support';

export function TicketForm() {
  const router = useRouter();
  const create = useCreateSupportTicket();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
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

    try {
      const ticket = await create.mutateAsync(parsed.data);
      router.push(`/destek/${ticket.id}`);
    } catch {
      setError(t('support.submitFailed'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('support.createTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
          <Field label={t('support.subject')} required error={error && !subject.trim() ? error : undefined}>
            {(props) => (
              <Input
                {...props}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t('support.subjectPlaceholder')}
                maxLength={160}
              />
            )}
          </Field>

          <Field label={t('support.body')} required>
            {(props) => (
              <Textarea
                {...props}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t('support.bodyPlaceholder')}
                rows={6}
                maxLength={4000}
              />
            )}
          </Field>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t('support.submitting') : t('support.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
