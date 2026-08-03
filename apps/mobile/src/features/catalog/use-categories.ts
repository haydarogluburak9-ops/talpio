import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@ustapilot/config';
import type { ServiceCategory } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/**
 * Kategoriler veritabanından gelir; uygulamada sabit liste tutulmaz. Sorgu
 * anahtarı web ve admin ile ortaktır.
 */
export function useCategories(options: { withSubcategories?: boolean } = {}) {
  const withSubcategories = options.withSubcategories ?? false;

  return useQuery<ServiceCategory[]>({
    queryKey: queryKeys.catalog.categories({ withSubcategories }),
    queryFn: ({ signal }) => apiClient.catalog.listCategories({ withSubcategories, signal }),
    // Katalog nadiren değişir; her sekme geçişinde yeniden çekilmesi gereksiz.
    staleTime: 10 * 60_000,
  });
}

export function useCategory(slug: string) {
  return useQuery<ServiceCategory>({
    queryKey: queryKeys.catalog.category(slug),
    queryFn: ({ signal }) => apiClient.catalog.getCategory(slug, signal),
    enabled: slug.length > 0,
    staleTime: 10 * 60_000,
  });
}
