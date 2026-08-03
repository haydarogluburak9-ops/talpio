'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, type LoginPayload } from '@ustapilot/api-client';
import { queryKeys } from '@ustapilot/config';
import { UserRole, type CurrentUser } from '@ustapilot/types';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api-client';

/** Panele girebilen roller. Müşteri ve usta hesapları buraya alınmaz. */
export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.SUPPORT,
];

export function isStaff(user: CurrentUser | null | undefined): boolean {
  return user ? STAFF_ROLES.includes(user.role) : false;
}

/** Yazma işlemleri yapabilen roller; destek yalnızca okur. */
export function canWrite(user: CurrentUser | null | undefined): boolean {
  return user ? user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN : false;
}

/**
 * Oturum durumu. Jetonlar HTTP-only çerezde olduğu için "giriş yapılmış mı"
 * sorusu yalnızca `/auth/me` yanıtından öğrenilebilir; 401 beklenen bir
 * sonuçtur ve hata değil `null` olarak döner.
 */
export function useSession() {
  return useQuery<CurrentUser | null>({
    queryKey: queryKeys.auth.session(),
    queryFn: async ({ signal }) => {
      try {
        return await apiClient.auth.me(signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => apiClient.auth.login(payload),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.auth.session(), session.user);
      // Panel dışı roller oturum açsa bile yönlendirilmez; koruma katmanı
      // uyarıyı gösterir ve kullanıcı bilgisiz kalmaz.
      if (isStaff(session.user)) router.replace('/dashboard');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.auth.logout(),
    onSettled: () => {
      queryClient.setQueryData(queryKeys.auth.session(), null);
      queryClient.clear();
      router.replace('/login');
    },
  });
}
