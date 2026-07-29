import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';

import { PrismaClient } from '../../src/generated/prisma/client';
import { COUNTRIES } from './data/locations';
import { SYSTEM_SETTINGS } from './data/system-settings';

loadEnv({ path: path.resolve(__dirname, '../../../../.env'), quiet: true });
loadEnv({ path: path.resolve(__dirname, '../../.env'), override: true, quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL tanımlı değil. Seed çalıştırılamıyor.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedLocations(): Promise<void> {
  for (const country of COUNTRIES) {
    const createdCountry = await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        phoneCode: country.phoneCode,
        currency: country.currency,
        defaultLocale: country.defaultLocale,
      },
      create: {
        code: country.code,
        name: country.name,
        phoneCode: country.phoneCode,
        currency: country.currency,
        defaultLocale: country.defaultLocale,
      },
    });

    for (const city of country.cities) {
      const createdCity = await prisma.city.upsert({
        where: { countryId_name: { countryId: createdCountry.id, name: city.name } },
        update: { code: city.code, latitude: city.latitude, longitude: city.longitude },
        create: {
          countryId: createdCountry.id,
          name: city.name,
          code: city.code,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      });

      for (const district of city.districts) {
        await prisma.district.upsert({
          where: { cityId_name: { cityId: createdCity.id, name: district.name } },
          update: {
            ...(district.latitude !== undefined ? { latitude: district.latitude } : {}),
            ...(district.longitude !== undefined ? { longitude: district.longitude } : {}),
          },
          create: {
            cityId: createdCity.id,
            name: district.name,
            ...(district.latitude !== undefined ? { latitude: district.latitude } : {}),
            ...(district.longitude !== undefined ? { longitude: district.longitude } : {}),
          },
        });
      }

      console.log(`  ${city.name}: ${city.districts.length} ilçe yüklendi`);
    }
  }
}

async function seedSystemSettings(): Promise<void> {
  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value as never, description: setting.description },
      create: {
        key: setting.key,
        value: setting.value as never,
        description: setting.description,
        isSecret: setting.isSecret ?? false,
      },
    });
  }
  console.log(`  ${SYSTEM_SETTINGS.length} sistem ayarı yüklendi`);
}

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV ?? 'development';
  console.log(`UstaPilot seed başlıyor (ortam: ${environment})`);

  console.log('Konumlar:');
  await seedLocations();

  console.log('Sistem ayarları:');
  await seedSystemSettings();

  // Demo hesapları ve örnek iş akışı verisi, ilgili modeller eklendiğinde
  // (Faz 2 ve Faz 4) bu noktaya bağlanacaktır.
  if (process.env.SEED_DEMO_ACCOUNTS === 'true') {
    if (environment === 'production') {
      throw new Error('Demo verisi production ortamında oluşturulamaz.');
    }
    console.log('Demo verisi: kullanıcı modelleri Faz 2 ile birlikte eklenecek.');
  }

  console.log('Seed tamamlandı.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed başarısız:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
