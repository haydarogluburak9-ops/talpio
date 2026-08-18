'use client';

import { BrandMark } from '@talpio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { t } from '@/lib/i18n';
import { NAV_GROUPS } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <BrandMark className="size-11" />
        <p className="text-xs text-foreground-muted">{t('admin.brandSubtitle')}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.titleKey} className="mb-5">
            <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
              {t(group.titleKey)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-[--radius-control] px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-100'
                          : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {item.planned && (
                        <span
                          title={t('admin.skeleton')}
                          className="ml-auto rounded-full bg-surface-muted px-1.5 py-0.5 text-[0.625rem] uppercase text-foreground-muted"
                        >
                          {t('admin.skeleton')}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
