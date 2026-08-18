'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import type { ServiceCategory } from '@talpio/types';

import { apiClient } from '@/lib/api';

export function useCategories(options: { withSubcategories?: boolean } = {}) {
  const withSubcategories = options.withSubcategories ?? false;

  return useQuery<ServiceCategory[]>({
    queryKey: queryKeys.catalog.categories({ withSubcategories }),
    queryFn: ({ signal }) => apiClient.catalog.listCategories({ withSubcategories, signal }),
    // Kategoriler nadiren değişir; gereksiz istek yapılmaz.
    staleTime: 10 * 60 * 1000,
  });
}
