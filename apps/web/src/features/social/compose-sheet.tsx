'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useCompose } from './compose-context';
import { PostComposer } from './post-composer';
import { QuickActions } from './quick-actions';

export function ComposeSheet() {
  const session = useSession();
  const { open, expand, closeCompose } = useCompose();
  const loggedIn = Boolean(session.data);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCompose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, closeCompose]);

  if (!open || !loggedIn) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0 bg-black/45"
        onClick={closeCompose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-sheet-title"
        className="relative max-h-[min(92svh,820px)] overflow-y-auto rounded-t-[1.35rem] border border-border/70 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgb(0_0_0_/_0.18)] dark:bg-[#0D1B2A]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-white/95 px-4 py-3 backdrop-blur dark:bg-[#0D1B2A]/95">
          <h2 id="compose-sheet-title" className="text-base font-semibold text-brand-900 dark:text-foreground">
            {t('social.composeSheetTitle')}
          </h2>
          <button
            type="button"
            onClick={closeCompose}
            className="grid size-9 place-items-center rounded-xl text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <PostComposer expand={expand} onPublished={closeCompose} />
          <QuickActions onNavigate={closeCompose} />
        </div>
      </div>
    </div>
  );
}
