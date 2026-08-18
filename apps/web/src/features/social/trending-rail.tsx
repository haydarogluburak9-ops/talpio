'use client';

import { cn } from '@talpio/ui';
import { Hash } from 'lucide-react';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useTrending } from './use-social';

export function TrendingRail({ compact = false }: { compact?: boolean }) {
  const session = useSession();
  const trending = useTrending(Boolean(session.data));

  if (!session.data) return null;
  if (trending.isPending) return null;

  const items = trending.data ?? [];

  return (
    <div className={cn('social-panel', compact ? 'px-4 py-3' : 'p-5')}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-info-50 text-info-600">
          <Hash className="size-4" aria-hidden />
        </span>
        <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('social.trendingTitle')}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t('social.trendingEmpty')}</p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((topic, index) => (
            <li key={topic.slug}>
              <Link
                href={`/gundem/${encodeURIComponent(topic.slug)}`}
                className="flex items-baseline justify-between gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-surface-muted"
              >
                <span className="min-w-0 truncate font-semibold text-foreground">
                  <span className="mr-2 inline-grid size-5 place-items-center rounded-full bg-accent-50 text-[10px] font-bold text-accent-600">
                    {index + 1}
                  </span>
                  <span className="text-info-600">#</span>
                  {topic.display}
                </span>
                <span className="shrink-0 text-xs text-foreground-muted">{topic.postCount}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
