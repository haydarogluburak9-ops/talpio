'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@ustapilot/config';
import type { City, Country, ServiceCategory } from '@ustapilot/types';

import { apiClient } from '@/lib/api-client';

export function useAdminCategories() {
  return useQuery<ServiceCategory[]>({
    queryKey: queryKeys.catalog.categories({ withSubcategories: true }),
    queryFn: ({ signal }) =>
      apiClient.catalog.listCategories({ withSubcategories: true, signal }),
    staleTime: 60_000,
  });
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ['catalog', 'countries'],
    queryFn: ({ signal }) => apiClient.catalog.listCountries(signal),
    staleTime: 5 * 60_000,
  });
}

export function useCities(countryCode: string | undefined) {
  return useQuery<City[]>({
    queryKey: queryKeys.catalog.cities(countryCode),
    queryFn: ({ signal }) => apiClient.catalog.listCities(countryCode, signal),
    enabled: countryCode !== undefined,
    staleTime: 5 * 60_000,
  });
}
