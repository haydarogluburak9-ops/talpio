'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_GROUPS } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <span className="flex size-9 items-center justify-center rounded-[--radius-control] bg-brand-600 text-sm font-bold text-white">
          UP
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">UstaPilot</p>
          <p className="text-xs text-foreground-muted">Yönetim Paneli</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.planned ? '#' : item.href}
                      aria-disabled={item.planned}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-[--radius-control] px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-100'
                          : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                        item.planned && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                      )}
                      onClick={(event) => {
                        if (item.planned) event.preventDefault();
                      }}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                      {item.planned && (
                        <span className="ml-auto text-[0.625rem] uppercase">yakında</span>
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
