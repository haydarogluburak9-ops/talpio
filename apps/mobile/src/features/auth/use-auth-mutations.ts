import { useMutation } from '@tanstack/react-query';

import { ApiError, type LoginPayload, type RegisterPayload } from '@talpio/api-client';
import type { AuthSession } from '@talpio/types';

import { useSession } from '@/features/auth/session-provider';
import { apiClient } from '@/lib/api';

/**
 * Kimlik hatalarını kullanıcıya gösterilebilir metne çevirir. Backend zaten
 * Türkçe mesaj döner; burada yalnızca ağ/beklenmeyen hatalar karşılanır.
 */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function useLogin() {
  const { signIn } = useSession();

  return useMutation({
    mutationFn: (payload: LoginPayload): Promise<AuthSession> => apiClient.auth.login(payload),
    onSuccess: (session) => signIn(session.tokens, session.user),
  });
}

export function useRegister() {
  const { signIn } = useSession();

  return useMutation({
    mutationFn: (payload: RegisterPayload): Promise<AuthSession> =>
      apiClient.auth.register(payload),
    onSuccess: (session) => signIn(session.tokens, session.user),
  });
}

export function useLogout() {
  const { signOut } = useSession();

  return useMutation({
    mutationFn: () => apiClient.auth.logout(),
    // Sunucu ulaşılamasa bile yerel oturum kapatılır; kullanıcı ekranda kalmaz.
    onSettled: () => signOut(),
  });
}
