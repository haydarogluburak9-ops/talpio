'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, type LoginPayload, type RegisterPayload } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { CurrentUser } from '@talpio/types';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api';
import { INTEREST_ONBOARDING_PATH, needsInterestOnboarding } from '@/lib/interest-onboarding';

/**
 * Oturum durumu. Jetonlar HTTP-only çerezde olduğu için istemci "giriş yapılmış
 * mı" sorusunu yalnızca `/auth/me` yanıtından öğrenebilir.
 *
 * 401 beklenen bir sonuçtur (ziyaretçi); hata olarak değil, `null` olarak döner.
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

function useAfterAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async (user: CurrentUser, options?: { fromRegister?: boolean }) => {
    queryClient.setQueryData(queryKeys.auth.session(), user);

    if (options?.fromRegister) {
      router.push(INTEREST_ONBOARDING_PATH);
      return;
    }

    try {
      const follows = await apiClient.social.listCategoryFollows();
      router.push(needsInterestOnboarding(follows.length) ? INTEREST_ONBOARDING_PATH : '/akis');
    } catch {
      router.push(INTEREST_ONBOARDING_PATH);
    }
  };
}

export function useLogin() {
  const afterAuth = useAfterAuth();

  return useMutation({
    mutationFn: (payload: LoginPayload) => apiClient.auth.login(payload),
    onSuccess: (session) => void afterAuth(session.user),
  });
}

export function useRegister() {
  const afterAuth = useAfterAuth();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => apiClient.auth.register(payload),
    onSuccess: (session) => void afterAuth(session.user, { fromRegister: true }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.auth.logout(),
    onSettled: () => {
      queryClient.setQueryData(queryKeys.auth.session(), null);
      void queryClient.invalidateQueries();
      router.push('/');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.users.deleteMe(),
    onSettled: () => {
      queryClient.setQueryData(queryKeys.auth.session(), null);
      void queryClient.invalidateQueries();
      router.push('/');
    },
  });
}
