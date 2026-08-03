import { Injectable } from '@nestjs/common';
import type { City, Country, District } from '@ustapilot/types';

import { PrismaService } from '@infra/prisma/prisma.service';

interface CoordinateRow {
  latitude: { toString(): string } | null;
  longitude: { toString(): string } | null;
}

/**
 * Konum hiyerarşisi: ülke → şehir → ilçe.
 *
 * Gaziantep hiçbir yerde koda gömülü değildir; yalnızca başlangıç verisidir.
 * Yeni şehir eklemek için veri girmek yeterlidir, kod değişikliği gerekmez.
 */
@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listCountries(): Promise<Country[]> {
    const countries = await this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return countries.map((country) => ({
      id: country.id,
      code: country.code,
      name: country.name,
      phoneCode: country.phoneCode,
      currency: country.currency,
      defaultLocale: country.defaultLocale,
      isActive: country.isActive,
      createdAt: country.createdAt.toISOString(),
      updatedAt: country.updatedAt.toISOString(),
    }));
  }

  async listCities(countryCode?: string): Promise<City[]> {
    const cities = await this.prisma.city.findMany({
      where: {
        isActive: true,
        ...(countryCode ? { country: { code: countryCode.toUpperCase() } } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return cities.map((city) => ({
      id: city.id,
      countryId: city.countryId,
      name: city.name,
      code: city.code,
      location: this.toGeoPoint(city),
      isActive: city.isActive,
      createdAt: city.createdAt.toISOString(),
      updatedAt: city.updatedAt.toISOString(),
    }));
  }

  async listDistricts(cityId: string): Promise<District[]> {
    const districts = await this.prisma.district.findMany({
      where: { cityId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return districts.map((district) => ({
      id: district.id,
      cityId: district.cityId,
      name: district.name,
      location: this.toGeoPoint(district),
      isActive: district.isActive,
      createdAt: district.createdAt.toISOString(),
      updatedAt: district.updatedAt.toISOString(),
    }));
  }

  /** Prisma Decimal'i JSON'a güvenli sayıya çevirir. */
  private toGeoPoint(row: CoordinateRow): { latitude: number; longitude: number } | null {
    if (row.latitude === null || row.longitude === null) return null;
    return {
      latitude: Number(row.latitude.toString()),
      longitude: Number(row.longitude.toString()),
    };
  }
}
