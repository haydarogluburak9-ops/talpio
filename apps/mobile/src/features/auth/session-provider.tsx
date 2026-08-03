import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AuthTokens, CurrentUser, UserRole } from '@ustapilot/types';

import { tokenStore } from '@/lib/api';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionValue {
  status: SessionStatus;
  user: CurrentUser | null;
  role: UserRole | null;
  signIn: (tokens: AuthTokens, user: CurrentUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Oturum durumu. Jetonlar güvenli depolamada tutulur; burada yalnızca oturumun
 * açık olup olmadığı ve kullanıcı özeti bellekte tutulur.
 *
 * NOT: Backend'de `/auth/me` ucu devreye girdiğinde açılışta profil buradan
 * çekilecek. Şu an yalnızca jeton varlığına bakılıyor.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    void tokenStore.getAccessToken().then((token) => {
      if (cancelled) return;
      setStatus(token ? 'authenticated' : 'anonymous');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (tokens: AuthTokens, nextUser: CurrentUser) => {
    await tokenStore.setTokens(tokens);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ status, user, role: user?.role ?? null, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession, SessionProvider içinde kullanılmalıdır.');
  return context;
}
