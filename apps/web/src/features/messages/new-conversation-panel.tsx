'use client';

import { ApiError } from '@talpio/api-client';
import type { SocialProfile } from '@talpio/types';
import { Button } from '@talpio/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { PeoplePicker } from './people-picker';
import { useCreateGroupConversation, useStartDirectConversation } from './use-messages';

type Mode = 'direct' | 'group';

/**
 * Yeni sohbet paneli.
 *
 * Tek kişiye yazmak varsayılan akıştır; grup moduna geçildiğinde aynı arama
 * listesi çoklu seçime döner ve bir grup adı istenir.
 */
export function NewConversationPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const startDirect = useStartDirectConversation();
  const createGroup = useCreateGroupConversation();

  const [mode, setMode] = useState<Mode>('direct');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<SocialProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  function openConversation(id: string) {
    onClose();
    router.push(`/mesajlar/${id}`);
  }

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
      onSuccess: (conversation) => openConversation(conversation.id),
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
        memberIds: selected.map((person) => person.userId).filter((id): id is string => Boolean(id)),
      },
      {
        onSuccess: (conversation) => openConversation(conversation.id),
        onError: (err) => setError(err instanceof ApiError ? err.message : t('status.errorMessage')),
      },
    );
  }

  return (
    <div className="flex max-h-[26rem] flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {mode === 'direct' ? t('messaging.newMessageTitle') : t('messaging.newGroup')}
        </h2>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'direct' ? 'group' : 'direct');
            setSelected([]);
            setError(null);
          }}
          className="shrink-0 text-xs font-semibold text-info-500 hover:underline"
        >
          {mode === 'direct' ? t('messaging.switchToGroup') : t('messaging.switchToDirect')}
        </button>
      </div>

      {mode === 'group' ? (
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('messaging.groupTitlePlaceholder')}
          aria-label={t('messaging.groupTitle')}
          className="h-10 w-full shrink-0 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-accent-500/40"
        />
      ) : null}

      <PeoplePicker
        query={query}
        onQueryChange={setQuery}
        onSelect={onSelect}
        selectedUserIds={selected
          .map((person) => person.userId)
          .filter((id): id is string => Boolean(id))}
        requireUserId={mode === 'group'}
        autoFocus
      />

      {error ? <p className="shrink-0 text-sm text-danger-500">{error}</p> : null}

      {mode === 'group' ? (
        <div className="flex shrink-0 items-center justify-between gap-3">
          <span className="text-xs text-foreground-muted">
            {t('messaging.selectedCount', { count: selected.length })}
          </span>
          <Button type="button" size="sm" onClick={onCreateGroup} disabled={createGroup.isPending}>
            {createGroup.isPending ? t('messaging.creatingGroup') : t('messaging.createGroup')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
