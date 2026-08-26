import path from 'node:path';

import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';

import { PrismaClient } from '../../src/generated/prisma/client';
import { UserRole, UserStatus, VerificationStatus } from '../../src/generated/prisma/enums';
import { ATTRIBUTE_SCHEMA_SEEDS } from './data/attribute-schemas';
import {
  AI_FEATURE_SEEDS,
  ALL_AI_FEATURES,
  FREE_PLAN_FEATURES,
  SUBSCRIPTION_PLAN_SEEDS,
} from './data/billing';
import { COMMERCE_CATEGORIES, SERVICE_CATEGORIES } from './data/categories';
import { COMMISSION_RULES } from './data/commission';
import { DEMO_ACCOUNTS, LEGACY_DEMO_EMAILS } from './data/demo-accounts';
import { seedSocialNetwork } from './data/social-feed';
import { COUNTRIES } from './data/locations';
import { LEGACY_ROLE_PLATFORM_MAP, PLATFORM_ROLE_SEEDS } from './data/platform-roles';
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
  const keepSlugs = COMMERCE_CATEGORIES.map((category) => category.slug);
  // Eski satıcı dikeyi pasifleştirilir; FK bozulmasın diye silinmez.
  const deactivated = await prisma.serviceCategory.updateMany({
    where: { slug: { notIn: keepSlugs }, isActive: true },
    data: { isActive: false },
  });

  for (const [index, category] of SERVICE_CATEGORIES.entries()) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        iconKey: category.iconKey,
        sortOrder: index,
        isActive: true,
        deletedAt: null,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        iconKey: category.iconKey,
        sortOrder: index,
        isActive: true,
      },
    });

    for (const [subIndex, subcategory] of category.subcategories.entries()) {
      await prisma.serviceSubcategory.upsert({
        where: { categoryId_slug: { categoryId: created.id, slug: subcategory.slug } },
        update: { name: subcategory.name, sortOrder: subIndex, isActive: true, deletedAt: null },
        create: {
          categoryId: created.id,
          slug: subcategory.slug,
          name: subcategory.name,
          sortOrder: subIndex,
          isActive: true,
        },
      });
    }
  }

  const subcategoryCount = SERVICE_CATEGORIES.reduce(
    (total, category) => total + category.subcategories.length,
    0,
  );
  console.log(
    `  ${SERVICE_CATEGORIES.length} ticaret kategorisi, ${subcategoryCount} alt kategori yüklendi` +
      (deactivated.count ? ` (${deactivated.count} eski kategori pasif)` : ''),
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
async function seedPlatformRoles(): Promise<void> {
  for (const role of PLATFORM_ROLE_SEEDS) {
    const created = await prisma.platformRole.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description, isSystem: true },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });

    for (const permissionCode of role.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionCode: { roleId: created.id, permissionCode },
        },
        update: {},
        create: { roleId: created.id, permissionCode },
      });
    }
  }
  console.log(`  ${PLATFORM_ROLE_SEEDS.length} platform rolü yüklendi`);
}

async function seedBilling(): Promise<void> {
  for (const plan of SUBSCRIPTION_PLAN_SEEDS) {
    const created = await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        monthlyCredits: plan.monthlyCredits,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      create: {
        code: plan.code,
        name: plan.name,
        monthlyCredits: plan.monthlyCredits,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    });

    await prisma.aiQuotaPolicy.upsert({
      where: { planId: created.id },
      update: { monthlyCredits: plan.monthlyCredits },
      create: {
        planId: created.id,
        monthlyCredits: plan.monthlyCredits,
        priorityQueue: plan.code !== 'FREE',
      },
    });

    const features =
      plan.code === 'FREE' ? FREE_PLAN_FEATURES : ALL_AI_FEATURES;
    for (const featureCode of features) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureCode: { planId: created.id, featureCode },
        },
        update: { included: true },
        create: { planId: created.id, featureCode, included: true },
      });
    }
  }

  for (const feature of AI_FEATURE_SEEDS) {
    await prisma.aiFeature.upsert({
      where: { code: feature.code },
      update: {
        name: feature.name,
        baseCostCredits: feature.baseCostCredits,
        description: feature.description,
      },
      create: {
        code: feature.code,
        name: feature.name,
        baseCostCredits: feature.baseCostCredits,
        description: feature.description,
      },
    });
  }

  console.log(
    `  ${SUBSCRIPTION_PLAN_SEEDS.length} plan, ${AI_FEATURE_SEEDS.length} AI özelliği yüklendi`,
  );
}

async function seedAttributeSchemas(): Promise<void> {
  let loaded = 0;

  for (const seed of ATTRIBUTE_SCHEMA_SEEDS) {
    const category = await prisma.serviceCategory.findUnique({
      where: { slug: seed.categorySlug },
      select: { id: true },
    });
    if (!category) {
      console.warn(`  ${seed.categorySlug} kategorisi bulunamadı; alan şeması atlandı`);
      continue;
    }

    const schema = { version: seed.version, fields: seed.fields };

    await prisma.attributeSchema.upsert({
      where: { categoryId_version: { categoryId: category.id, version: seed.version } },
      update: { schema, isActive: true },
      create: { categoryId: category.id, version: seed.version, schema, isActive: true },
    });
    loaded += 1;
  }

  console.log(`  ${loaded}/${ATTRIBUTE_SCHEMA_SEEDS.length} kategori alan şeması yüklendi`);
}

async function assignPlatformRolesForUser(userId: string, legacyRole: string): Promise<void> {
  const code = LEGACY_ROLE_PLATFORM_MAP[legacyRole];
  if (!code) return;

  const role = await prisma.platformRole.findUnique({ where: { code }, select: { id: true } });
  if (!role) return;

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}

async function removeLegacyDemoAccounts(): Promise<void> {
  let deactivated = 0;

  for (const email of LEGACY_DEMO_EMAILS) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!existing) continue;

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: `legacy.${existing.id.slice(0, 8)}.${email}`,
        phone: null,
        status: UserStatus.DEACTIVATED,
        deletedAt: new Date(),
      },
    });
    deactivated += 1;
  }

  if (deactivated > 0) {
    console.log(`  ${deactivated} eski marka demo hesabı kapatıldı`);
  }
}

async function seedDemoAccounts(password: string): Promise<void> {
  await removeLegacyDemoAccounts();

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

    await assignPlatformRolesForUser(user.id, account.role);

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
  await seedDemoSocialProfiles();
}

async function findCityIdByName(name?: string | null): Promise<string | null> {
  if (!name) return null;
  const city = await prisma.city.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return city?.id ?? null;
}

/** Demo hesaplar için kişisel sosyal profil. */
async function seedDemoSocialProfiles(): Promise<void> {
  for (const account of DEMO_ACCOUNTS) {
    const user = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true, fullName: true },
    });
    if (!user) continue;

    const locationCityId = await findCityIdByName(account.locationText);

    await prisma.socialProfile.upsert({
      where: { userId: user.id },
      update: {
        username: account.socialUsername,
        displayName: user.fullName,
        bio: account.bio ?? null,
        locationText: account.locationText ?? null,
        locationCityId,
        deletedAt: null,
      },
      create: {
        kind: 'PERSONAL',
        userId: user.id,
        username: account.socialUsername,
        displayName: user.fullName,
        bio: account.bio ?? null,
        locationText: account.locationText ?? null,
        locationCityId,
      },
    });
  }

  console.log('  Demo sosyal profilleri hazır');
}

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV ?? 'development';
  console.log(`Talpio seed başlıyor (ortam: ${environment})`);

  console.log('Konumlar:');
  await seedLocations();

  console.log('Hizmet kategorileri:');
  await seedServiceCategories();

  console.log('Platform rolleri:');
  await seedPlatformRoles();

  console.log('AI faturalama planları:');
  await seedBilling();

  console.log('Attribute şemaları:');
  await seedAttributeSchemas();

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
    console.log('Sosyal ticaret ağı:');
    await seedSocialNetwork(prisma);
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
