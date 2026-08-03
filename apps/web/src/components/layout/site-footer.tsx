import { Wordmark } from '@ustapilot/ui';
import Link from 'next/link';

import { t } from '@/lib/i18n';
import { footerNav } from '@/lib/navigation';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="max-w-xs text-sm text-foreground-muted text-balance-safe">
            {t('common.tagline')}
          </p>
        </div>

        {footerNav.map((group) => (
          <nav key={group.titleKey} className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t(group.titleKey)}</span>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        ))}

        <nav className="flex flex-col gap-2">
          <span className="text-sm font-semibold">{t('system.statusTitle')}</span>
          <Link href="/sistem-durumu" className="text-sm text-foreground-muted hover:text-foreground">
            {t('system.statusTitle')}
          </Link>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-foreground-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {t('common.appName')}
        </div>
      </div>
    </footer>
  );
}
