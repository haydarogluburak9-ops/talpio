'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ProviderServiceInput,
  UpdateProviderProfileBody,
  UpdateUserProfileBody,
} from '@ustapilot/api-client';
import { queryKeys } from '@ustapilot/config';

import { apiClient } from '@/lib/api';

/**
 * Profil güncellemesi oturum sorgusunu da tazeler: başlıktaki ad ve görsel aynı
 * `/auth/me` yanıtından beslenir, yalnızca form durumunu güncellemek arayüzü
 * tutarsız bırakırdı.
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserProfileBody) => apiClient.users.updateMe(body),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.session(), user);
    },
  });
}

export function useProviderProfile() {
  return useQuery({
    queryKey: queryKeys.providers.me(),
    queryFn: ({ signal }) => apiClient.providers.getMe(signal),
    staleTime: 60_000,
  });
}

export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProviderProfileBody) => apiClient.providers.updateMe(body),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.providers.me(), profile);
    },
  });
}

export function useMyServices() {
  return useQuery({
    queryKey: queryKeys.providers.myServices(),
    queryFn: ({ signal }) => apiClient.providers.listMyServices(signal),
    staleTime: 60_000,
  });
}

/** Hizmet listesi profildeki kategori rozetlerini de belirler; ikisi birlikte tazelenir. */
export function useReplaceMyServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (services: ProviderServiceInput[]) =>
      apiClient.providers.replaceMyServices(services),
    onSuccess: (services) => {
      queryClient.setQueryData(queryKeys.providers.myServices(), services);
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.me() });
    },
  });
}

export function useReplaceMyServiceAreas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (districtIds: string[]) => apiClient.providers.replaceMyServiceAreas(districtIds),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.providers.me(), profile);
    },
  });
}
