'use client';

import { readIsDark, setTheme, subscribeToTheme } from '@ustapilot/ui';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

export function ThemeToggle() {
  // Tema sınıfı React dışında (head betiği) yönetildiği için dış kaynak olarak okunur.
  const isDark = useSyncExternalStore(subscribeToTheme, readIsDark, () => false);

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="grid size-10 place-items-center rounded-[--radius-control] text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
