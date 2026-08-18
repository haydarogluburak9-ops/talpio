import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@talpio/config';
import type { CurrentUser } from '@talpio/types';

import { useSession } from '@/features/auth/session-provider';
import { apiClient } from '@/lib/api';

/** Oturum açık kullanıcının sunucudaki güncel profili. */
export function useCurrentUser() {
  const { status } = useSession();

  return useQuery<CurrentUser>({
    queryKey: queryKeys.auth.session(),
    queryFn: ({ signal }) => apiClient.auth.me(signal),
    enabled: status === 'authenticated',
  });
}
