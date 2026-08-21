import { Module } from '@nestjs/common';

import { StorageModule } from '@infra/storage/storage.module';

import { SocialMaintenanceService } from './social-maintenance.service';

/** Worker için yalnızca sosyal bakım işleri; HTTP controller ve feed bağımlılıkları yok. */
@Module({
  imports: [StorageModule],
  providers: [SocialMaintenanceService],
  exports: [SocialMaintenanceService],
})
export class WorkerSocialModule {}
