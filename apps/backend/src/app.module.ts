import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { AppConfigService } from '@config/app-config.service';
import { AppConfigModule } from '@config/config.module';
import { LoggerModule } from '@infra/logging/logger.module';
import { NotificationSenderModule } from '@infra/notifications/notification-sender.module';
import { PaymentProviderModule } from '@infra/payments/payment-provider.module';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { RedisModule } from '@infra/redis/redis.module';
import { StorageModule } from '@infra/storage/storage.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { FilesModule } from '@modules/files/files.module';
import { HealthModule } from '@modules/health/health.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { LocationsModule } from '@modules/locations/locations.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { OffersModule } from '@modules/offers/offers.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { SupportModule } from '@modules/support/support.module';
import { UsersModule } from '@modules/users/users.module';

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
    StorageModule,
    PaymentProviderModule,
    NotificationSenderModule,
    HealthModule,
    AuthModule,
    CatalogModule,
    LocationsModule,
    JobsModule,
    OffersModule,
    OrdersModule,
    PaymentsModule,
    MessagesModule,
    NotificationsModule,
    FilesModule,
    UsersModule,
    ProvidersModule,
    ReviewsModule,
    SupportModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Kimlik doğrulama varsayılan olarak açıktır; herkese açık uçlar
    // `@Public()` ile işaretlenir. Rol kontrolü kimlikten sonra çalışır.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
