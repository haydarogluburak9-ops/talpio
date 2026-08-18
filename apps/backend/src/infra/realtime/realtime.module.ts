import { Global, Module } from '@nestjs/common';

import { RealtimeBusService } from './realtime-bus.service';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [RealtimeBusService],
  exports: [RealtimeBusService],
})
export class RealtimeModule {}
