import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { AppConfigService } from '@config/app-config.service';
import { AppConfigModule } from '@config/config.module';
import { LoggerModule } from '@infra/logging/logger.module';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { RedisModule } from '@infra/redis/redis.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    EventEmitterModule.forRoot({ global: true, delimiter: '.' }),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.throttle.ttlSeconds * 1000,
            limit: config.throttle.limit,
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
