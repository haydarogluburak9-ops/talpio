'use client';

import { BrandMark } from '@talpio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isAppShellPath } from '@/lib/app-shell-paths';
import { t } from '@/lib/i18n';
import { footerNav } from '@/lib/navigation';

const COPYRIGHT_YEAR = 2026;

export function SiteFooter() {
  const pathname = usePathname();
  // Public landing referans kompozisyonunda büyük footer yok; app shell'de de gizli.
  if (pathname === '/' || isAppShellPath(pathname)) return null;

  return (
    <footer className="relative mt-auto overflow-hidden bg-brand-900 text-brand-100">
      <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3">
          <BrandMark className="size-14" />
          <p className="max-w-xs text-sm leading-relaxed text-brand-100/75 text-balance-safe">
            {t('common.tagline')}
          </p>
        </div>

        {footerNav.map((group) => (
          <nav key={group.titleKey} className="flex flex-col gap-2.5">
            <span className="font-display text-sm font-semibold tracking-wide text-white">
              {t(group.titleKey)}
            </span>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-brand-200/80 transition-colors hover:text-accent-400"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        ))}

        <nav className="flex flex-col gap-2.5">
          <span className="font-display text-sm font-semibold tracking-wide text-white">
            {t('system.statusTitle')}
          </span>
          <Link
            href="/sistem-durumu"
            className="text-sm text-brand-200/80 transition-colors hover:text-accent-400"
          >
            {t('system.statusTitle')}
          </Link>
        </nav>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-brand-300/70 sm:px-6 lg:px-8">
          <span>
            © {COPYRIGHT_YEAR} {t('common.appName')}
          </span>
        </div>
      </div>
    </footer>
  );
}
