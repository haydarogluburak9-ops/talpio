import { Module } from '@nestjs/common';

import { FilesModule } from '@modules/files/files.module';

import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [FilesModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
