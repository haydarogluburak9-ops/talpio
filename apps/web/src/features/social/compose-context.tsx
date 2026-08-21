'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useSession } from '@/features/auth/use-session';

export type ComposeExpand = 'media' | 'promo' | 'story';
export type ComposeView = 'menu' | 'composer';

type ComposeContextValue = {
  open: boolean;
  view: ComposeView;
  expand: ComposeExpand | null;
  openCompose: (expand?: ComposeExpand) => void;
  openComposer: (expand?: ComposeExpand | null) => void;
  showComposeMenu: () => void;
  closeCompose: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ComposeView>('menu');
  const [expand, setExpand] = useState<ComposeExpand | null>(null);

  const requireAuth = useCallback(
    (mode?: ComposeExpand) => {
      if (session.data) return true;
      const next = mode ? `${pathname}?compose=${mode}` : pathname;
      router.push(`/giris?next=${encodeURIComponent(next)}`);
      return false;
    },
    [pathname, router, session.data],
  );

  const openCompose = useCallback(
    (mode?: ComposeExpand) => {
      if (!requireAuth(mode)) return;
      if (mode) {
        setExpand(mode);
        setView('composer');
      } else {
        setExpand(null);
        setView('menu');
      }
      setOpen(true);
    },
    [requireAuth],
  );

  const openComposer = useCallback(
    (mode?: ComposeExpand | null) => {
      if (!requireAuth(mode ?? undefined)) return;
      setExpand(mode ?? null);
      setView('composer');
      setOpen(true);
    },
    [requireAuth],
  );

  const showComposeMenu = useCallback(() => {
    setView('menu');
    setExpand(null);
    setOpen(true);
  }, []);

  const closeCompose = useCallback(() => {
    setOpen(false);
    setView('menu');
    setExpand(null);
  }, []);

  const value = useMemo(
    () => ({ open, view, expand, openCompose, openComposer, showComposeMenu, closeCompose }),
    [open, view, expand, openCompose, openComposer, showComposeMenu, closeCompose],
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) {
    throw new Error('useCompose must be used within ComposeProvider');
  }
  return ctx;
}
