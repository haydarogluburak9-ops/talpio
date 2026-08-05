import { Module } from '@nestjs/common';

import { NotificationsModule } from '@modules/notifications/notifications.module';
import { SupportModule } from '@modules/support/support.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [NotificationsModule, SupportModule],
  controllers: [AdminController],
  providers: [AdminService, AuditLogService],
  exports: [AuditLogService],
})
export class AdminModule {}
