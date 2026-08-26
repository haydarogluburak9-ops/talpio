import { API_ROUTES } from '@talpio/config';
import type { AuthSession, CurrentUser } from '@talpio/types';

import type { HttpClient } from '../http-client';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  username: string;
  phone?: string;
  locale?: string;
  interestCategoryIds?: string[];
  acceptedMarketing?: boolean;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  password: string;
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

    requestEmailVerification(signal?: AbortSignal): Promise<{ sent: true }> {
      return http.post(API_ROUTES.auth.requestEmailVerification, {}, { signal });
    },

    verifyEmail(token: string, signal?: AbortSignal): Promise<{ verified: true }> {
      return http.post(API_ROUTES.auth.verifyEmail, { token }, { signal });
    },

    requestPhoneCode(phone: string, signal?: AbortSignal): Promise<{ sent: true }> {
      return http.post(API_ROUTES.auth.requestPhoneCode, { phone }, { signal });
    },

    verifyPhone(phone: string, code: string, signal?: AbortSignal): Promise<{ verified: true }> {
      return http.post(API_ROUTES.auth.verifyPhone, { phone, code }, { signal });
    },

    forgotPassword(email: string, signal?: AbortSignal): Promise<{ sent: true }> {
      return http.post(API_ROUTES.auth.forgotPassword, { email }, { signal });
    },

    resetPassword(token: string, password: string, signal?: AbortSignal): Promise<{ reset: true }> {
      return http.post(API_ROUTES.auth.resetPassword, { token, password }, { signal });
    },

    /**
     * Oturum sahibinin kendi şifresini değiştirir. Diğer cihazlardaki oturumlar
     * sunucuda kapanır; isteği yapan oturum ayakta kaldığı için jetonlar
     * yenilenmez.
     */
    changePassword(
      payload: ChangePasswordPayload,
      signal?: AbortSignal,
    ): Promise<{ changed: true }> {
      return http.post(API_ROUTES.auth.changePassword, payload, { signal });
    },
  };
}
