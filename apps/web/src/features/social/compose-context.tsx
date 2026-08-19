'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ComposeExpand = 'media' | 'promo' | 'story' | null;

type ComposeContextValue = {
  open: boolean;
  expand: ComposeExpand;
  openCompose: (expand?: ComposeExpand) => void;
  closeCompose: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [expand, setExpand] = useState<ComposeExpand>(null);

  const openCompose = useCallback((mode?: ComposeExpand) => {
    setExpand(mode ?? null);
    setOpen(true);
  }, []);

  const closeCompose = useCallback(() => {
    setOpen(false);
    setExpand(null);
  }, []);

  const value = useMemo(
    () => ({ open, expand, openCompose, closeCompose }),
    [open, expand, openCompose, closeCompose],
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
