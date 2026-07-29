import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Ortam değişkenleri monorepo kökündeki tek .env dosyasında tutulur.
loadEnv({ path: path.resolve(__dirname, '../../.env'), quiet: true });
loadEnv({ path: path.resolve(__dirname, '.env'), override: true, quiet: true });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    // `prisma generate` veritabanı adresine ihtiyaç duymaz; bu yüzden env() yerine
    // boş değere düşen okuma kullanılır.
    url: process.env.DATABASE_URL ?? '',
  },
});
