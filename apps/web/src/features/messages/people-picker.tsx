'use client';

import type { SocialProfile } from '@talpio/types';
import { cn } from '@talpio/ui';
import { Check, Search } from 'lucide-react';

import { useFollowingList, useSearchProfiles, useSocialMe } from '@/features/social/use-social';
import { t } from '@/lib/i18n';

const MIN_QUERY_LENGTH = 2;

/**
 * Kişi arama ve seçme listesi.
 *
 * Arama kutusu boşken takip edilenler önerilir; iki harften sonra sunucu
 * araması devreye girer. Grup üyeliği kullanıcı kimliği gerektirdiğinden
 * işletme profilleri `requireUserId` ile elenebilir.
 */
export function PeoplePicker({
  query,
  onQueryChange,
  onSelect,
  selectedUserIds = [],
  disabledUserIds = [],
  requireUserId = false,
  autoFocus = false,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (profile: SocialProfile) => void;
  selectedUserIds?: string[];
  disabledUserIds?: string[];
  requireUserId?: boolean;
  autoFocus?: boolean;
}) {
  const me = useSocialMe();
  const following = useFollowingList(me.data?.username ?? '', Boolean(me.data?.username));
  const search = useSearchProfiles(query);

  const needle = query.trim();
  const isSearching = needle.length >= MIN_QUERY_LENGTH;
  const source = isSearching ? search.data?.items : following.data?.items;
  const people = (source ?? []).filter((person) => !requireUserId || Boolean(person.userId));
  const isPending = isSearching ? search.isPending : following.isPending;

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <label className="relative block shrink-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted"
          aria-hidden
        />
        <span className="sr-only">{t('messaging.searchPeople')}</span>
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('messaging.searchPeople')}
          className="h-10 w-full rounded-xl border border-transparent bg-surface-muted/90 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-accent-500/40 focus:bg-surface"
        />
      </label>

      {!isSearching ? (
        <p className="shrink-0 px-1 text-xs font-medium text-foreground-muted">
          {needle.length > 0 ? t('messaging.searchHint') : t('messaging.suggestedPeople')}
        </p>
      ) : null}

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {isPending ? (
          <li className="px-1 py-2 text-sm text-foreground-muted">…</li>
        ) : people.length === 0 ? (
          <li className="px-1 py-2 text-sm text-foreground-muted">
            {isSearching ? t('messaging.searchEmpty') : t('messaging.groupEmpty')}
          </li>
        ) : (
          people.map((person) => {
            const userId = person.userId ?? '';
            const isDisabled = disabledUserIds.includes(userId);
            const isSelected = selectedUserIds.includes(userId);

            return (
              <li key={person.id}>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelect(person)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-muted disabled:opacity-50 disabled:hover:bg-transparent',
                    isSelected && 'bg-surface-muted',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-[11px] font-bold text-white">
                    {person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={person.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      person.displayName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {person.displayName}
                    </span>
                    <span className="block truncate text-xs text-foreground-muted">
                      @{person.username}
                      {isDisabled ? ` · ${t('messaging.memberAlreadyIn')}` : ''}
                    </span>
                  </span>
                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-accent-500" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
