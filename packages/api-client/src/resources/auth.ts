import { API_ROUTES } from '@ustapilot/config';
import type { AuthSession, CurrentUser, UserRole } from '@ustapilot/types';

import type { HttpClient } from '../http-client';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Extract<UserRole, 'CUSTOMER' | 'PROVIDER'>;
  phone?: string;
  locale?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

/**
 * Kimlik uçları. Başarılı çağrılarda jetonlar istemcinin jeton deposuna
 * yazılır; web'de bu bir no-op'tur çünkü sunucu HTTP-only çerez gönderir.
 */
export function createAuthResource(http: HttpClient) {
  const persist = async (session: AuthSession): Promise<AuthSession> => {
    await http.saveTokens(session.tokens);
    return session;
  };

  return {
    async register(payload: RegisterPayload, signal?: AbortSignal): Promise<AuthSession> {
      return persist(
        await http.post<AuthSession>(API_ROUTES.auth.register, payload, { signal }),
      );
    },

    async login(payload: LoginPayload, signal?: AbortSignal): Promise<AuthSession> {
      return persist(await http.post<AuthSession>(API_ROUTES.auth.login, payload, { signal }));
    },

    me(signal?: AbortSignal): Promise<CurrentUser> {
      return http.get<CurrentUser>(API_ROUTES.auth.me, { signal });
    },

    /** Sunucu tarafında başarısız olsa da yerel jetonlar her durumda silinir. */
    async logout(): Promise<void> {
      const refreshToken = await http.readRefreshToken();

      try {
        await http.post(API_ROUTES.auth.logout, refreshToken ? { refreshToken } : {}, {
          skipAuthRefresh: true,
        });
      } finally {
        await http.clearTokens();
      }
    },

    async logoutAll(): Promise<void> {
      try {
        await http.post(API_ROUTES.auth.logoutAll, {});
      } finally {
        await http.clearTokens();
      }
    },
  };
}
