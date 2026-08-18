'use client';

import { LOCALE_META, SUPPORTED_LOCALES, type SupportedLocale } from '@talpio/config';
import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { getLocale, hydrateLocale, subscribeLocale, t } from '@/lib/i18n';
import { persistLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const [locale, setLocaleState] = useState<SupportedLocale>(getLocale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => subscribeLocale(() => setLocaleState(getLocale())), []);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  function choose(next: SupportedLocale) {
    hydrateLocale(next);
    persistLocale(next);
    apiClient.setLocale(next);
    setLocaleState(next);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-[--radius-control] px-2.5 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('common.chooseLanguage')}
      >
        <Globe className="size-4" aria-hidden />
        <span className="hidden sm:inline">{LOCALE_META[locale].nativeLabel}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-[--radius-control] border border-border bg-surface py-1 shadow-sm"
        >
          {SUPPORTED_LOCALES.map((item) => (
            <li key={item}>
              <button
                type="button"
                role="option"
                aria-selected={item === locale}
                onClick={() => choose(item)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                  item === locale
                    ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-100'
                    : 'text-foreground hover:bg-surface-muted',
                )}
              >
                {LOCALE_META[item].nativeLabel}
                <span className="text-[10px] font-medium uppercase text-foreground-muted">
                  {item}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
