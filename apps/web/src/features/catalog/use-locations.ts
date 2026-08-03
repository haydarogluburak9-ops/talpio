'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@ustapilot/config';
import type { City, District } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/** Şehirler nadiren değişir; oturum boyunca tazelenmesi gerekmez. */
const LOCATION_STALE_TIME = 30 * 60 * 1000;

export function useCities(countryCode?: string) {
  return useQuery<City[]>({
    queryKey: queryKeys.catalog.cities(countryCode),
    queryFn: ({ signal }) => apiClient.catalog.listCities(countryCode, signal),
    staleTime: LOCATION_STALE_TIME,
  });
}

export function useDistricts(cityId: string | undefined) {
  return useQuery<District[]>({
    queryKey: queryKeys.catalog.districts(cityId ?? 'none'),
    queryFn: ({ signal }) => apiClient.catalog.listDistricts(cityId as string, signal),
    enabled: Boolean(cityId),
    staleTime: LOCATION_STALE_TIME,
  });
}
