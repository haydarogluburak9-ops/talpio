'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isAppShellPath, isAuthPath } from '@/lib/app-shell-paths';
import { t } from '@/lib/i18n';
import { footerNav } from '@/lib/navigation';

const publicFooterLinks = footerNav.flatMap((group) => group.items);

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === '/' || isAppShellPath(pathname) || isAuthPath(pathname)) return null;

  return (
    <footer className="mt-auto border-t border-[#E8EBF0] bg-white px-4 py-6">
      <nav
        aria-label={t('nav.legal')}
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs text-[#8E8E8E]"
      >
        {publicFooterLinks.map((item) => (
          <Link key={`${item.href}-${item.labelKey}`} href={item.href} className="hover:underline">
            {t(item.labelKey)}
          </Link>
        ))}
        <span>
          © {new Date().getFullYear()} {t('common.appName')}
        </span>
      </nav>
    </footer>
  );
}
