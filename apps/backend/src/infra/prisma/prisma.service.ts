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

  constructor(config: AppConfigService) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL') }),
      log: config.isProduction ? ['warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('PostgreSQL bağlantısı kuruldu');
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
