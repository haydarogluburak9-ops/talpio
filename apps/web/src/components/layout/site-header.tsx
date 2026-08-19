'use client';

import { BrandLockup, BrandMark, cn } from '@talpio/ui';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { NotificationBell } from '@/features/notifications/notification-bell';
import { isAppShellPath } from '@/lib/app-shell-paths';
import { t } from '@/lib/i18n';
import { landingNav, primaryNav } from '@/lib/navigation';

import { HeaderAccount } from './header-account';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const socialMode = isAppShellPath(pathname);
  const landingMode = pathname === '/';
  const [menu, setMenu] = useState({ isOpen: false, path: pathname });
  const [query, setQuery] = useState('');

  // Yönlendirmeden sonra açık kalan menü mobilde içeriğin üstünü kapatır.
  if (menu.path !== pathname) setMenu({ isOpen: false, path: pathname });

  const isMenuOpen = menu.isOpen;
  const toggleMenu = () => setMenu((current) => ({ ...current, isOpen: !current.isOpen }));
  const navItems = landingMode ? landingNav : primaryNav;

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        !landingMode && 'border-b',
        socialMode
          ? 'border-border/70 bg-white shadow-[0_1px_0_rgb(2_27_50_/_0.05)] dark:bg-white'
          : landingMode
            ? 'bg-white text-[#0D1B2A]'
            : 'border-border/60 bg-surface/80 shadow-[0_1px_0_rgb(2_27_50_/_0.04)] backdrop-blur-xl',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-[4.25rem] w-full items-center gap-3 px-3 sm:px-4',
          socialMode
            ? 'max-w-none lg:px-5'
            : landingMode
              ? 'h-[84px] max-w-[1500px] px-6 sm:px-10 lg:px-12'
              : 'max-w-6xl sm:px-6 lg:px-8',
        )}
      >
        <Link
          href={socialMode ? '/akis' : '/'}
          className="inline-flex shrink-0 items-center"
          aria-label={t('common.appName')}
        >
          {socialMode ? (
            <BrandLockup className="h-11 sm:h-12" />
          ) : landingMode ? (
            // PNG doğrudan — paket derlemesine bağlı kalmadan boyut/cache kontrolü.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand/talpio-lockup-light.png?v=3"
              alt="Talpio"
              className="block h-14 w-auto sm:h-16 lg:h-[4.75rem]"
              draggable={false}
            />
          ) : (
            <BrandMark className="size-12 sm:size-[3.25rem]" />
          )}
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
          <nav
            aria-label={t('nav.mainMenu')}
            className={cn(
              'ml-4 hidden items-center gap-0.5 lg:flex',
              landingMode && 'ml-8 flex-1 justify-center',
            )}
          >
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    landingMode
                      ? active
                        ? 'font-semibold text-[#0D1B2A]'
                        : 'text-[#475467] hover:bg-[#F4F6F8] hover:text-[#0D1B2A]'
                      : active
                        ? 'nav-link-active font-semibold'
                        : 'text-foreground-muted hover:bg-brand-50 hover:text-brand-900 dark:hover:bg-white/5 dark:hover:text-foreground',
                  )}
                >
                  {t(item.labelKey)}
                  {landingMode && item.labelKey === 'nav.resources' ? (
                    <ChevronDown className="size-3.5 opacity-70" aria-hidden />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {socialMode ? (
            <>
              <LanguageSwitcher variant="social" />
              <ThemeToggle variant="labeled" />
              <NotificationBell />
              <HeaderAccount variant="avatar" />
            </>
          ) : landingMode ? (
            <>
              <button
                type="button"
                className="hidden size-10 place-items-center rounded-xl text-[#475467] hover:bg-[#F4F6F8] hover:text-[#0D1B2A] sm:grid"
                aria-label={t('common.search')}
                onClick={() => router.push('/kategoriler')}
              >
                <Search className="size-5" />
              </button>
              <LanguageSwitcher variant="landing" />
              <Link
                href="/giris"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#0D1B2A] hover:bg-[#F4F6F8] sm:inline-flex"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/kayit"
                className="inline-flex h-[46px] min-w-[150px] items-center justify-center rounded-[10px] bg-[#FF5A0A] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgb(255_90_10_/_0.28)] hover:bg-[#EA4B00]"
              >
                {t('nav.freeRegister')}
              </Link>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <ThemeToggle variant="labeled" />
              <div className="hidden sm:block">
                <HeaderAccount />
              </div>
            </>
          )}

          <button
            type="button"
            className={cn(
              'grid size-10 place-items-center rounded-xl md:hidden',
              socialMode && 'hidden',
              landingMode ? 'text-[#0D1B2A] hover:bg-[#F4F6F8]' : 'hover:bg-surface-muted',
            )}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? t('common.close') : t('nav.openMenu')}
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div
          id="mobile-nav"
          className={cn(
            'border-t md:hidden',
            landingMode ? 'border-[#E8EBF0] bg-white' : 'border-border bg-surface/98',
          )}
        >
          <nav
            aria-label={t('nav.mainMenu')}
            className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6"
          >
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-xl px-3 py-3 text-sm font-medium',
                    landingMode
                      ? active
                        ? 'bg-[#F4F6F8] font-semibold text-[#0D1B2A]'
                        : 'text-[#475467] hover:bg-[#F4F6F8]'
                      : cn('hover:bg-surface-muted', active && 'nav-link-active font-semibold'),
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            {!landingMode && !socialMode ? (
              <div className="mt-2 flex items-center gap-2 sm:hidden">
                <ThemeToggle variant="labeled" />
                <HeaderAccount variant="mobile" />
              </div>
            ) : null}
            {landingMode ? (
              <div className="mt-2 flex flex-col gap-2 sm:hidden">
                <Link
                  href="/giris"
                  className="rounded-xl px-3 py-3 text-center text-sm font-medium text-[#0D1B2A] ring-1 ring-[#E8EBF0]"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/kayit"
                  className="rounded-xl bg-accent-500 px-3 py-3 text-center text-sm font-semibold text-white"
                >
                  {t('nav.freeRegister')}
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
