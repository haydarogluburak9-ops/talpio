'use client';

import { cn } from '@talpio/ui';
import { BadgePercent, ClipboardPlus, ImagePlus } from 'lucide-react';
import Link from 'next/link';

import { t } from '@/lib/i18n';

import { useCompose } from './compose-context';

export function QuickActions({ onNavigate }: { onNavigate?: () => void }) {
  const { openCompose } = useCompose();

  const items = [
    {
      key: 'request',
      label: t('social.quickRequest'),
      icon: ClipboardPlus,
      tone: 'text-warning-700 bg-warning-50',
      onClick: () => onNavigate?.(),
      href: '/tedarik' as const,
    },
    {
      key: 'deal',
      label: t('social.quickDeal'),
      icon: BadgePercent,
      tone: 'text-accent-600 bg-accent-50',
      onClick: () => openCompose('promo'),
    },
    {
      key: 'media',
      label: t('social.quickMedia'),
      icon: ImagePlus,
      tone: 'text-success-700 bg-success-50',
      onClick: () => openCompose('media'),
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <span className={cn('grid size-9 place-items-center rounded-xl', item.tone)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="leading-tight">{item.label}</span>
          </>
        );

        if ('href' in item && item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              className="social-panel flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-foreground hover:border-accent-500/30"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="social-panel flex items-center gap-2.5 px-3 py-3 text-left text-sm font-semibold text-foreground hover:border-accent-500/30"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
