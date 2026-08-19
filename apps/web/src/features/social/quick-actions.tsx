'use client';

import { cn } from '@talpio/ui';
import { BadgePercent, ClipboardPlus, PenLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';

import { useCompose } from './compose-context';

export function ComposeMenu({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { openComposer, closeCompose } = useCompose();

  const items = [
    {
      key: 'post',
      label: t('social.quickPost'),
      icon: PenLine,
      tone: 'text-brand-800 bg-brand-50',
      onClick: () => openComposer(null),
    },
    {
      key: 'request',
      label: t('social.quickRequest'),
      icon: ClipboardPlus,
      tone: 'text-warning-700 bg-warning-50',
      onClick: () => {
        onNavigate?.();
        closeCompose();
        router.push('/tedarik');
      },
    },
    {
      key: 'deal',
      label: t('social.quickDeal'),
      icon: BadgePercent,
      tone: 'text-accent-600 bg-accent-50',
      onClick: () => openComposer('promo'),
    },
  ] as const;

  return (
    <div className="grid gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <span className={cn('grid size-10 place-items-center rounded-xl', item.tone)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="text-base font-semibold">{item.label}</span>
          </>
        );

        if (item.key === 'request') {
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="social-panel flex w-full items-center gap-3 px-4 py-4 text-left text-foreground hover:border-accent-500/30"
            >
              {content}
            </button>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="social-panel flex w-full items-center gap-3 px-4 py-4 text-left text-foreground hover:border-accent-500/30"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

/** @deprecated Use ComposeMenu */
export function QuickActions(props: { onNavigate?: () => void }) {
  return <ComposeMenu {...props} />;
}
