'use client';

import { ApiError } from '@talpio/api-client';
import { Button, Field, Input } from '@talpio/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useFollowingList, useSocialMe } from '@/features/social/use-social';
import { t } from '@/lib/i18n';

import { useCreateGroupConversation } from './use-messages';

export function NewGroupForm() {
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
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
      router.push(`/mesajlar/${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('status.errorMessage'));
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="social-panel flex flex-col gap-3 p-5">
      <h2 className="font-display text-lg font-semibold">{t('messaging.newGroup')}</h2>
      <Field label={t('messaging.groupTitle')}>
        {(props) => (
          <Input
            {...props}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('messaging.groupTitlePlaceholder')}
          />
        )}
      </Field>
      <p className="text-sm text-foreground-muted">{t('messaging.groupMembers')}</p>
      {people.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t('messaging.groupEmpty')}</p>
      ) : null}
      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {people.map((person) => {
          const userId = person.userId as string;
          const on = selected.includes(userId);
          return (
            <li key={person.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={on} onChange={() => toggle(userId)} />
                {person.displayName}
              </label>
            </li>
          );
        })}
      </ul>
      {error ? <p className="text-sm text-danger-500">{error}</p> : null}
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? t('messaging.creatingGroup') : t('messaging.createGroup')}
      </Button>
    </form>
  );
}
