'use client';

import { BrandLockup, cn } from '@talpio/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { NotificationBell } from '@/features/notifications/notification-bell';
import { isAppShellPath, isAuthPath, isMinimalHeaderPath } from '@/lib/app-shell-paths';
import { t } from '@/lib/i18n';

import { HeaderAccount } from './header-account';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const socialMode = isAppShellPath(pathname);
  const landingMode = pathname === '/';
  const minimalHeader = isMinimalHeaderPath(pathname);
  const authPage = isAuthPath(pathname);
  const [query, setQuery] = useState('');

  if (authPage) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        !landingMode && 'border-b',
        socialMode
          ? 'border-border/70 bg-white shadow-[0_1px_0_rgb(2_27_50_/_0.05)] dark:bg-white'
          : landingMode
            ? 'bg-white text-[#0D1B2A]'
            : 'border-[#E8EBF0] bg-white text-[#0D1B2A]',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-[4.25rem] w-full items-center gap-3 px-3 sm:px-4',
          socialMode
            ? 'max-w-none lg:px-5'
            : landingMode
              ? 'h-[4.25rem] max-w-[1500px] px-6 sm:px-10 lg:px-12'
              : 'max-w-6xl sm:px-6 lg:px-8',
        )}
      >
        <Link
          href={socialMode ? '/akis' : '/'}
          className="inline-flex shrink-0 items-center"
          aria-label={t('common.appName')}
        >
          <BrandLockup className="h-7 sm:h-8" />
        </Link>

        {socialMode ? (
          <form
            className="mx-auto hidden min-w-0 max-w-lg flex-1 md:block"
            onSubmit={(event) => {
              event.preventDefault();
              const q = query.trim();
              if (q) router.push(`/kategoriler?q=${encodeURIComponent(q)}`);
            }}
          >
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden
              />
              <span className="sr-only">{t('common.search')}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('social.searchPlaceholder')}
                className="h-10 w-full rounded-xl border border-transparent bg-brand-50/80 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-accent-500/40 focus:bg-white"
              />
            </label>
          </form>
        ) : (
          <div className="flex-1" aria-hidden />
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {socialMode ? (
            <>
              <LanguageSwitcher variant="social" />
              <ThemeToggle variant="labeled" />
              <NotificationBell />
              <HeaderAccount variant="avatar" />
            </>
          ) : minimalHeader ? (
            <>
              {landingMode ? (
                <button
                  type="button"
                  className="hidden size-10 place-items-center rounded-xl text-[#475467] hover:bg-[#F4F6F8] hover:text-[#0D1B2A] sm:grid"
                  aria-label={t('common.search')}
                  onClick={() => router.push('/kategoriler')}
                >
                  <Search className="size-5" />
                </button>
              ) : null}
              <LanguageSwitcher variant={landingMode ? 'landing' : 'default'} />
              <Link
                href="/giris"
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#F4F6F8]',
                  landingMode ? 'text-[#0D1B2A]' : 'text-[#475467] hover:text-[#0D1B2A]',
                )}
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/kayit"
                className={cn(
                  'inline-flex h-[46px] min-w-[150px] items-center justify-center rounded-[10px] px-4 text-sm font-semibold text-white',
                  landingMode
                    ? 'bg-[#FF5A0A] shadow-[0_8px_18px_rgb(255_90_10_/_0.28)] hover:bg-[#EA4B00]'
                    : 'bg-accent-500 hover:bg-accent-600',
                )}
              >
                {t('nav.freeRegister')}
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
