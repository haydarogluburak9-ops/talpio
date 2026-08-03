import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@ustapilot/config';
import type { City, District } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/** Konum verisi neredeyse hiç değişmez; oturum boyunca tazelemeye gerek yok. */
const LOCATION_STALE_TIME = 30 * 60_000;

export function useCities(countryCode?: string) {
  return useQuery<City[]>({
    queryKey: queryKeys.catalog.cities(countryCode),
    queryFn: ({ signal }) => apiClient.catalog.listCities(countryCode, signal),
    staleTime: LOCATION_STALE_TIME,
  });
}

export function useDistricts(cityId: string | null) {
  return useQuery<District[]>({
    queryKey: queryKeys.catalog.districts(cityId ?? 'none'),
    queryFn: ({ signal }) => apiClient.catalog.listDistricts(cityId as string, signal),
    enabled: cityId !== null,
    staleTime: LOCATION_STALE_TIME,
  });
}
