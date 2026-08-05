import { Module } from '@nestjs/common';

import { NotificationsModule } from '@modules/notifications/notifications.module';

import { JobOffersController, OffersController } from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  imports: [NotificationsModule],
  controllers: [OffersController, JobOffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
