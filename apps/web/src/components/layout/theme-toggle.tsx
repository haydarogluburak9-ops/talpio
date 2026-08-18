'use client';

import { readIsDark, setTheme, subscribeToTheme, cn } from '@talpio/ui';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

export function ThemeToggle({
  variant = 'icon',
}: {
  /** icon: kompakt; labeled: açık/koyu metinli */
  variant?: 'icon' | 'labeled';
}) {
  // Tema sınıfı React dışında (head betiği) yönetildiği için dış kaynak olarak okunur.
  const isDark = useSyncExternalStore(subscribeToTheme, readIsDark, () => false);

  if (variant === 'labeled') {
    return (
      <button
        type="button"
        onClick={() => setTheme(!isDark)}
        aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:border-accent-500/40 hover:bg-surface-muted"
      >
        {isDark ? <Sun className="size-4 text-accent-500" /> : <Moon className="size-4 text-brand-900" />}
        <span className="hidden sm:inline">{isDark ? 'Açık' : 'Koyu'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className={cn(
        'grid size-10 place-items-center rounded-xl border border-border/80 bg-surface text-foreground-muted transition-colors hover:border-accent-500/40 hover:bg-surface-muted hover:text-foreground',
      )}
    >
      {isDark ? <Sun className="size-5 text-accent-500" /> : <Moon className="size-5" />}
    </button>
  );
}
