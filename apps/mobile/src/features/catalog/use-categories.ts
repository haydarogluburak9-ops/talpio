import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@talpio/config';
import type { CategoryAttributeSchema, ServiceCategory } from '@talpio/types';

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

/**
 * Kategoriye özel talep alanları. Kategori seçilmeden istek atılmaz; şeması
 * olmayan kategoriler boş alan listesiyle döner.
 */
export function useCategoryAttributeSchema(categoryId: string | undefined) {
  return useQuery<CategoryAttributeSchema>({
    queryKey: queryKeys.catalog.categoryAttributeSchema(categoryId ?? ''),
    queryFn: ({ signal }) =>
      apiClient.catalog.getCategoryAttributeSchema(categoryId as string, signal),
    enabled: Boolean(categoryId),
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
