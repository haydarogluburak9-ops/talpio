'use client';

import { BrandMark, cn, Wordmark } from '@ustapilot/ui';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { t } from '@/lib/i18n';
import { primaryNav } from '@/lib/navigation';

import { NotificationBell } from '@/features/notifications/notification-bell';

import { HeaderAccount } from './header-account';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  const pathname = usePathname();
  const [menu, setMenu] = useState({ isOpen: false, path: pathname });

  // Yönlendirmeden sonra açık kalan menü mobilde içeriğin üstünü kapatır.
  // Sıfırlama efekt yerine render sırasında yapılır: menü hiçbir zaman yeni
  // sayfayla birlikte bir kare boyunca açık görünmez.
  if (menu.path !== pathname) setMenu({ isOpen: false, path: pathname });

  const isMenuOpen = menu.isOpen;
  const toggleMenu = () => setMenu((current) => ({ ...current, isOpen: !current.isOpen }));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label={t('common.appName')}>
          <BrandMark />
          <Wordmark className="text-base" />
        </Link>

        <nav aria-label={t('nav.mainMenu')} className="ml-4 hidden items-center gap-1 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-[--radius-control] px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground',
                pathname === item.href && 'bg-surface-muted text-foreground',
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />

          <div className="hidden sm:block">
            <HeaderAccount />
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-[--radius-control] hover:bg-surface-muted md:hidden"
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
        <div id="mobile-nav" className="border-t border-border bg-surface md:hidden">
          <nav
            aria-label={t('nav.mainMenu')}
            className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[--radius-control] px-3 py-3 text-sm font-medium hover:bg-surface-muted"
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <div className="mt-2 sm:hidden">
              <HeaderAccount variant="mobile" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
