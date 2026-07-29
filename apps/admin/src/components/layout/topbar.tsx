'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { readIsDark, setTheme, subscribeToTheme } from '@/lib/theme';

export function Topbar({ title, description }: { title: string; description?: string }) {
  // Tema durumu DOM'da tutulur; sunucu tarafında varsayılan açık temadır.
  const isDark = useSyncExternalStore(subscribeToTheme, readIsDark, () => false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-foreground-muted">{description}</p>}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(!isDark)}
        aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      >
        {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      </Button>
    </header>
  );
}
