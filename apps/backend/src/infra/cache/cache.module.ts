import { Global, Module } from '@nestjs/common';

import { FeedCacheService } from './feed-cache.service';

@Global()
@Module({
  providers: [FeedCacheService],
  exports: [FeedCacheService],
})
export class CacheModule {}
