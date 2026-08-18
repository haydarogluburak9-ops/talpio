import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { AppConfigService } from '@config/app-config.service';
import { AppConfigModule } from '@config/config.module';
import { AiProviderModule } from '@infra/ai/ai-provider.module';
import { CacheModule } from '@infra/cache/cache.module';
import { LoggerModule } from '@infra/logging/logger.module';
import { MediaModule } from '@infra/media/media.module';
import { MetricsInterceptor } from '@infra/metrics/metrics.interceptor';
import { MetricsModule } from '@infra/metrics/metrics.module';
import { RealtimeModule } from '@infra/realtime/realtime.module';
import { NotificationSenderModule } from '@infra/notifications/notification-sender.module';
import { OutboxModule } from '@infra/outbox/outbox.module';
import { PaymentProviderModule } from '@infra/payments/payment-provider.module';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { QueueModule } from '@infra/queue/queue.module';
import { RedisModule } from '@infra/redis/redis.module';
import { StorageModule } from '@infra/storage/storage.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AgentModule } from '@modules/agent/agent.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { BillingModule } from '@modules/billing/billing.module';
import { BusinessesModule } from '@modules/businesses/businesses.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { FilesModule } from '@modules/files/files.module';
import { FraudModule } from '@modules/fraud/fraud.module';
import { HealthModule } from '@modules/health/health.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { LocationsModule } from '@modules/locations/locations.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { OffersModule } from '@modules/offers/offers.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { RequestsModule } from '@modules/requests/requests.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { SocialModule } from '@modules/social/social.module';
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
    CacheModule,
    RealtimeModule,
    MediaModule,
    MetricsModule,
    StorageModule,
    PaymentProviderModule,
    NotificationSenderModule,
    AiProviderModule,
    QueueModule,
    OutboxModule,
    HealthModule,
    FraudModule,
    RbacModule,
    BillingModule,
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
    SocialModule,
    SupportModule,
    AdminModule,
    AgentModule,
    BusinessesModule,
    RequestsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Kimlik doğrulama varsayılan olarak açıktır; herkese açık uçlar
    // `@Public()` ile işaretlenir. Rol kontrolü kimlikten sonra çalışır;
    // @RequirePermissions varsa PermissionsGuard ek kontrol uygular.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
