import Link from 'next/link';

import { t } from '@/lib/i18n';
import { footerNav } from '@/lib/navigation';

const authFooterLinks = [
  { href: '/nasil-calisir', labelKey: 'nav.howItWorks' },
  ...footerNav.flatMap((group) => group.items),
] as const;

export function AuthLegalFooter() {
  return (
    <footer className="px-4 py-6 lg:py-8">
      <nav
        aria-label={t('nav.legal')}
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs text-[#8E8E8E]"
      >
        {authFooterLinks.map((item) => (
          <Link key={item.href} href={item.href} className="hover:underline">
            {t(item.labelKey)}
          </Link>
        ))}
        <span>© {new Date().getFullYear()} {t('common.appName')}</span>
      </nav>
    </footer>
  );
}
