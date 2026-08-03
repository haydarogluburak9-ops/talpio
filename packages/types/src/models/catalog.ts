import type { BaseEntity, GeoPoint } from './common';

export interface ServiceCategory extends BaseEntity {
  slug: string;
  name: string;
  description?: string | null;
  iconKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories?: ServiceSubcategory[];
}

export interface ServiceSubcategory extends BaseEntity {
  categoryId: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Country extends BaseEntity {
  code: string;
  name: string;
  phoneCode: string;
  currency: string;
  defaultLocale: string;
  isActive: boolean;
}

export interface City extends BaseEntity {
  countryId: string;
  name: string;
  code?: string | null;
  location?: GeoPoint | null;
  isActive: boolean;
}

export interface District extends BaseEntity {
  cityId: string;
  name: string;
  location?: GeoPoint | null;
  isActive: boolean;
}

export interface Neighborhood extends BaseEntity {
  districtId: string;
  name: string;
  postalCode?: string | null;
  isActive: boolean;
}

export interface Address extends BaseEntity {
  userId: string;
  title: string;
  cityId: string;
  districtId: string;
  neighborhoodId?: string | null;
  /** Açık adres yalnızca yetkili tarafa gösterilir. */
  addressLine?: string | null;
  location?: GeoPoint | null;
  isDefault: boolean;
}

/**
 * İş ilanında ustalara gösterilen adres. Teklif kabul edilene kadar açık adres
 * ve koordinat gizlenir; yalnızca ilçe seviyesi paylaşılır.
 */
export interface MaskedAddress {
  cityName: string;
  districtName: string;
  neighborhoodName?: string | null;
  addressLine?: string | null;
  location?: GeoPoint | null;
  isFullyVisible: boolean;
}
