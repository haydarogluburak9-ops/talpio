'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import type { CategoryAttributeSchema, ServiceCategory } from '@talpio/types';

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
    staleTime: 10 * 60 * 1000,
  });
}
