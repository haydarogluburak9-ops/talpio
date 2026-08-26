'use client';

import type { SocialProfile } from '@talpio/types';
import { EmptyState, ListSkeleton } from '@talpio/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { localeTag, t } from '@/lib/i18n';

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
  countLabelKey,
  searchLabel,
}: {
  pending: boolean;
  items: SocialProfile[];
  totalCount: number;
  countLabelKey: 'social.followersCountLabel' | 'social.followingCountLabel';
  searchLabel: string;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase(localeTag());
  const visible =
    needle.length === 0
      ? items
      : items.filter(
          (person) =>
            person.displayName.toLocaleLowerCase(localeTag()).includes(needle) ||
            person.username.toLocaleLowerCase(localeTag()).includes(needle),
        );

  return (
    <div className="flex flex-col gap-3 pb-20 lg:pb-6">
      <div className="social-panel flex flex-col gap-3 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {t(countLabelKey, { count: totalCount })}
        </p>
        <label className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <span className="sr-only">{searchLabel}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchLabel}
            className="h-10 w-full rounded-xl border border-transparent bg-surface-muted/90 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-accent-500/40 focus:bg-surface"
          />
        </label>
      </div>

      {pending ? (
        <ListSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <div className="social-panel px-6 py-10">
          <EmptyState
            title={needle.length > 0 ? t('social.graphSearchEmpty') : t('social.emptyGraph')}
          />
        </div>
      ) : (
        <ul className="social-panel divide-y divide-border">
          {visible.map((person) => (
            <li key={person.id}>
              <Link
                href={`/u/${person.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
              >
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-xs font-bold text-white">
                  {person.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    person.displayName.slice(0, 1).toLocaleUpperCase(localeTag())
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{person.displayName}</span>
                  <span className="block truncate text-xs text-foreground-muted">
                    @{person.username}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
