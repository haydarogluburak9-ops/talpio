import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';

import { PrismaClient } from '../../src/generated/prisma/client';

import { refreshStories } from './data/social-feed';

loadEnv({ path: path.resolve(__dirname, '../../../../.env'), quiet: true });
loadEnv({ path: path.resolve(__dirname, '../../.env'), override: true, quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL tanımlı değil.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await refreshStories(prisma);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
