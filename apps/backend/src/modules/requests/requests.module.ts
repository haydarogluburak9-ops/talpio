import { Module } from '@nestjs/common';

import { AdminModule } from '@modules/admin/admin.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { OutboxModule } from '@infra/outbox/outbox.module';

import { RequestOffersController, RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [NotificationsModule, OutboxModule, AdminModule],
  controllers: [RequestsController, RequestOffersController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
