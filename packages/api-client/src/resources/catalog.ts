import { API_ROUTES } from '@talpio/config';
import type { City, Country, District, ServiceCategory } from '@talpio/types';

import type { HttpClient } from '../http-client';

export function createCatalogResource(http: HttpClient) {
  return {
    listCategories(
      options: { withSubcategories?: boolean; signal?: AbortSignal } = {},
    ): Promise<ServiceCategory[]> {
      return http.get<ServiceCategory[]>(API_ROUTES.catalog.categories, {
        query: { withSubcategories: options.withSubcategories },
        ...(options.signal ? { signal: options.signal } : {}),
      });
    },

    getCategory(slug: string, signal?: AbortSignal): Promise<ServiceCategory> {
      return http.get<ServiceCategory>(API_ROUTES.catalog.categoryById(slug), {
        ...(signal ? { signal } : {}),
      });
    },

    listCountries(signal?: AbortSignal): Promise<Country[]> {
      return http.get<Country[]>(API_ROUTES.catalog.countries, { ...(signal ? { signal } : {}) });
    },

    listCities(countryCode?: string, signal?: AbortSignal): Promise<City[]> {
      return http.get<City[]>(API_ROUTES.catalog.cities, {
        query: { countryCode },
        ...(signal ? { signal } : {}),
      });
    },

    listDistricts(cityId: string, signal?: AbortSignal): Promise<District[]> {
      return http.get<District[]>(API_ROUTES.catalog.districts, {
        query: { cityId },
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type CatalogResource = ReturnType<typeof createCatalogResource>;
