import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { AppConfigService } from '@config/app-config.service';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Okuma replikası bağlantısı.
 * DATABASE_READ_URL tanımlı değilse birincil bağlantıya düşer (PrismaService).
 */
@Injectable()
export class PrismaReadService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaReadService.name);
  readonly isReplica: boolean;

  constructor(config: AppConfigService) {
    const readUrl = config.databaseReadUrl ?? config.get('DATABASE_URL');
    super({
      adapter: new PrismaPg({ connectionString: readUrl }),
      log: config.isProduction ? ['warn', 'error'] : ['warn', 'error'],
    });
    this.isReplica = Boolean(config.databaseReadUrl);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log(
      this.isReplica ? 'PostgreSQL read replica bağlantısı kuruldu' : 'PostgreSQL read (primary) bağlantısı kuruldu',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
