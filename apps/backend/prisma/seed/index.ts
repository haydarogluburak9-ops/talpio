import path from 'node:path';

import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';

import { PrismaClient } from '../../src/generated/prisma/client';
import { UserRole, UserStatus, VerificationStatus } from '../../src/generated/prisma/enums';
import { SERVICE_CATEGORIES } from './data/categories';
import { COMMISSION_RULES } from './data/commission';
import { DEMO_ACCOUNTS } from './data/demo-accounts';
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

async function seedServiceCategories(): Promise<void> {
  for (const [index, category] of SERVICE_CATEGORIES.entries()) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        iconKey: category.iconKey,
        sortOrder: index,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        iconKey: category.iconKey,
        sortOrder: index,
      },
    });

    for (const [subIndex, subcategory] of category.subcategories.entries()) {
      await prisma.serviceSubcategory.upsert({
        where: { categoryId_slug: { categoryId: created.id, slug: subcategory.slug } },
        update: { name: subcategory.name, sortOrder: subIndex },
        create: {
          categoryId: created.id,
          slug: subcategory.slug,
          name: subcategory.name,
          sortOrder: subIndex,
        },
      });
    }
  }

  const subcategoryCount = SERVICE_CATEGORIES.reduce(
    (total, category) => total + category.subcategories.length,
    0,
  );
  console.log(
    `  ${SERVICE_CATEGORIES.length} kategori, ${subcategoryCount} alt kategori yüklendi`,
  );
}

async function seedCommissionRules(): Promise<void> {
  for (const rule of COMMISSION_RULES) {
    const existing = await prisma.commissionRule.findFirst({ where: { name: rule.name } });

    if (existing) {
      await prisma.commissionRule.update({
        where: { id: existing.id },
        data: {
          type: rule.type,
          rateBps: rule.rateBps,
          fixedMinor: rule.fixedMinor,
          premiumRateBps: rule.premiumRateBps,
          priority: rule.priority,
        },
      });
    } else {
      await prisma.commissionRule.create({ data: rule });
    }
  }
  console.log(`  ${COMMISSION_RULES.length} komisyon kuralı yüklendi`);
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

/**
 * Demo hesapları. Parolalar üretim akışıyla aynı biçimde argon2id ile
 * özetlenir; seed'e özel zayıf bir yol açılmaz.
 */
async function seedDemoAccounts(password: string): Promise<void> {
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const now = new Date();

  for (const account of DEMO_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, fullName: account.fullName, role: account.role },
      create: {
        email: account.email,
        phone: account.phone,
        passwordHash,
        fullName: account.fullName,
        role: account.role,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: now,
        phoneVerifiedAt: now,
      },
    });

    if (account.role === UserRole.CUSTOMER) {
      await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      continue;
    }

    if (!account.provider) continue;

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: account.provider.businessName,
        about: account.provider.about,
        experienceYears: account.provider.experienceYears,
      },
      create: {
        userId: user.id,
        businessName: account.provider.businessName,
        about: account.provider.about,
        experienceYears: account.provider.experienceYears,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    const category = await prisma.serviceCategory.findUnique({
      where: { slug: account.provider.categorySlug },
      select: { id: true },
    });

    if (category) {
      // Bileşik benzersiz anahtar nullable alan içerdiği için `upsert` yerine
      // varlık kontrolü yapılır.
      const existingService = await prisma.providerService.findFirst({
        where: { providerProfileId: profile.id, categoryId: category.id, subcategoryId: null },
        select: { id: true },
      });

      if (!existingService) {
        await prisma.providerService.create({
          data: { providerProfileId: profile.id, categoryId: category.id },
        });
      }
    }

    const districts = await prisma.district.findMany({
      where: { city: { name: account.provider.cityName } },
      select: { id: true },
    });

    for (const district of districts) {
      await prisma.providerServiceArea.upsert({
        where: {
          providerProfileId_districtId: {
            providerProfileId: profile.id,
            districtId: district.id,
          },
        },
        update: {},
        create: { providerProfileId: profile.id, districtId: district.id },
      });
    }
  }

  console.log(`  ${DEMO_ACCOUNTS.length} demo hesabı yüklendi`);
}

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV ?? 'development';
  console.log(`UstaPilot seed başlıyor (ortam: ${environment})`);

  console.log('Konumlar:');
  await seedLocations();

  console.log('Hizmet kategorileri:');
  await seedServiceCategories();

  console.log('Komisyon kuralları:');
  await seedCommissionRules();

  console.log('Sistem ayarları:');
  await seedSystemSettings();

  if (process.env.SEED_DEMO_ACCOUNTS === 'true') {
    if (environment === 'production') {
      throw new Error('Demo verisi production ortamında oluşturulamaz.');
    }

    console.log('Demo hesapları:');
    await seedDemoAccounts(process.env.DEMO_PASSWORD ?? 'Demo1234!');
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
