import { Module } from '@nestjs/common';

import { AdminModule } from '@modules/admin/admin.module';
import { SocialModule } from '@modules/social/social.module';

import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { CampaignsService } from './campaigns.service';
import { BusinessOpsService } from './ops.service';
import { TrustScoreService } from './trust-score.service';

@Module({
  imports: [SocialModule, AdminModule],
  controllers: [BusinessesController],
  providers: [BusinessesService, BusinessOpsService, CampaignsService, TrustScoreService],
  exports: [BusinessesService, TrustScoreService, BusinessOpsService],
})
export class BusinessesModule {}
