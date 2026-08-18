import { API_ROUTES } from '@talpio/config';
import type { CurrentUser } from '@talpio/types';

import type { HttpClient } from '../http-client';

export interface UpdateUserProfileBody {
  fullName?: string;
  /** `null` numarayı kaldırır. */
  phone?: string | null;
  /** `null` profil görselini kaldırır. */
  avatarFileId?: string | null;
  locale?: string;
}

export function createUsersResource(http: HttpClient) {
  return {
    getMe(signal?: AbortSignal): Promise<CurrentUser> {
      return http.get<CurrentUser>(API_ROUTES.users.me, {
        ...(signal ? { signal } : {}),
      });
    },

    /** Yalnızca gönderilen alanlar değişir; telefon değişirse doğrulama sıfırlanır. */
    updateMe(body: UpdateUserProfileBody): Promise<CurrentUser> {
      return http.patch<CurrentUser>(API_ROUTES.users.me, body);
    },

    /** Mağaza silme yükümlülüğü; oturum geçersiz kalır. */
    deleteMe(): Promise<void> {
      return http.delete<void>(API_ROUTES.users.me);
    },
  };
}

export type UsersResource = ReturnType<typeof createUsersResource>;
