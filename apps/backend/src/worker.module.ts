import { Module } from '@nestjs/common';

import { AppConfigModule } from '@config/config.module';
import { AiProviderModule } from '@infra/ai/ai-provider.module';
import { LoggerModule } from '@infra/logging/logger.module';
import { NotificationSenderModule } from '@infra/notifications/notification-sender.module';
import { MediaModule } from '@infra/media/media.module';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { QueueModule } from '@infra/queue/queue.module';
import { RedisModule } from '@infra/redis/redis.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AgentModule } from '@modules/agent/agent.module';
import { BillingModule } from '@modules/billing/billing.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { SocialModule } from '@modules/social/social.module';

/**
 * Worker için hafif Nest bağlamı.
 * HTTP controller'lar / outbox publisher yüklenmez.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    BillingModule,
    AiProviderModule,
    NotificationSenderModule,
    NotificationsModule,
    AdminModule,
    AgentModule,
    MediaModule,
    RbacModule,
    SocialModule,
  ],
})
export class WorkerModule {}
