import { Module } from '@nestjs/common';

import { FilesModule } from '@modules/files/files.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [FilesModule, NotificationsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
