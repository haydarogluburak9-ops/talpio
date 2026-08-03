import { API_ROUTES } from '@ustapilot/config';
import type { CurrentUser } from '@ustapilot/types';

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
  };
}

export type UsersResource = ReturnType<typeof createUsersResource>;
