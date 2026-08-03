'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { useLogout, useSession } from '@/features/auth/use-session';
import { readIsDark, setTheme, subscribeToTheme } from '@/lib/theme';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Süper admin',
  ADMIN: 'Admin',
  SUPPORT: 'Destek',
};

export function Topbar({ title, description }: { title: string; description?: string }) {
  // Tema durumu DOM'da tutulur; sunucu tarafında varsayılan açık temadır.
  const isDark = useSyncExternalStore(subscribeToTheme, readIsDark, () => false);
  const session = useSession();
  const logout = useLogout();
  const user = session.data;

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="truncate text-sm text-foreground-muted">{description}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {user ? (
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-foreground-muted">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(!isDark)}
          aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
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
            aria-label="Çıkış yap"
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
