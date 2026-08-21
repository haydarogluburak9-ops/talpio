import { Module } from '@nestjs/common';

import { AdminModule } from '@modules/admin/admin.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { OutboxModule } from '@infra/outbox/outbox.module';
import { RbacModule } from '@modules/rbac/rbac.module';

import { RequestOffersController, RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [NotificationsModule, OutboxModule, AdminModule, RbacModule],
  controllers: [RequestsController, RequestOffersController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
