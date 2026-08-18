import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { AppConfigService } from '@config/app-config.service';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Tek Prisma bağlantı havuzu. Modüller bu servisi enjekte eder,
 * kendi `new PrismaClient()` örneklerini oluşturmaz.
 *
 * Prisma 7 ile bağlantı, Rust motoru yerine `pg` sürücü adaptörü üzerinden kurulur.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: AppConfigService) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL') }),
      log: config.isProduction ? ['warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('PostgreSQL bağlantısı kuruldu');
    await this.assertMigrationsApplied();
  }

  /**
   * Bekleyen Prisma migrasyonu varsa süreç açılmaz.
   * Test ortamında atlanır (CI kendi `migrate deploy` adımını çalıştırır).
   */
  async assertMigrationsApplied(): Promise<void> {
    if (this.config.isTest || !this.config.get('STRICT_MIGRATION_CHECK')) return;

    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    let onDisk: string[] = [];
    try {
      onDisk = readdirSync(migrationsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== 'migration_lock.toml')
        .map((entry) => entry.name)
        .sort();
    } catch {
      this.logger.warn({ migrationsDir }, 'Migrasyon klasörü okunamadı; kontrol atlandı');
      return;
    }

    const applied = await this.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;
    const appliedSet = new Set(applied.map((row) => row.migration_name));
    const pending = onDisk.filter((name) => !appliedSet.has(name));
    if (pending.length === 0) return;

    throw new Error(
      `Bekleyen veritabanı migrasyonu var: ${pending.join(', ')}. \`npx prisma migrate deploy\` çalıştırın.`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('PostgreSQL bağlantısı kapatıldı');
  }

  /** Sağlık kontrolü için hafif bir sorgu. */
  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
