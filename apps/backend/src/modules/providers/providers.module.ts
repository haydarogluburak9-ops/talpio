import { Module } from '@nestjs/common';

import { FilesModule } from '@modules/files/files.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';

import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [ReviewsModule, FilesModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
