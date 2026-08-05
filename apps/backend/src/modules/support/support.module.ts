import { Module } from '@nestjs/common';

import { FilesModule } from '@modules/files/files.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [FilesModule, NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
