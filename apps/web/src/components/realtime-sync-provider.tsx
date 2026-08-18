'use client';

import type { ReactNode } from 'react';

import { useRealtimeSync } from '@/lib/use-realtime-sync';

/** Oturum açıkken SSE canlı senkronunu başlatır. */
export function RealtimeSyncProvider({ children }: { children: ReactNode }) {
  useRealtimeSync({ enabled: true });
  return children;
}
