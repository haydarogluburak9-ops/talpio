'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import { useLogout, useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';
import { readIsDark, setTheme, subscribeToTheme } from '@/lib/theme';

const ROLE_KEYS: Record<string, string> = {
  SUPER_ADMIN: 'admin.roleSuperAdmin',
  ADMIN: 'admin.roleAdmin',
  SUPPORT: 'admin.roleSupport',
};

export function Topbar({
  title,
  titleKey,
  description,
  descriptionKey,
}: {
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
}) {
  const isDark = useSyncExternalStore(subscribeToTheme, readIsDark, () => false);
  const session = useSession();
  const logout = useLogout();
  const user = session.data;
  const resolvedTitle = titleKey ? t(titleKey) : (title ?? '');
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description;

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{resolvedTitle}</h1>
        {resolvedDescription ? (
          <p className="truncate text-sm text-foreground-muted">{resolvedDescription}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {user ? (
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-foreground-muted">
              {ROLE_KEYS[user.role] ? t(ROLE_KEYS[user.role]) : user.role}
            </p>
          </div>
        ) : null}

        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(!isDark)}
          aria-label={isDark ? t('admin.themeLight') : t('admin.themeDark')}
        >
          {isDark ? (
            <Sun className="size-4" aria-hidden />
          ) : (
            <Moon className="size-4" aria-hidden />
          )}
        </Button>

        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            aria-label={t('admin.logout')}
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
