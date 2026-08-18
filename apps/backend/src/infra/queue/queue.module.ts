import { Global, Module } from '@nestjs/common';

import { QueueService } from './queue.service';
import { WorkerHeartbeatService } from './worker-heartbeat.service';

@Global()
@Module({
  providers: [QueueService, WorkerHeartbeatService],
  exports: [QueueService, WorkerHeartbeatService],
})
export class QueueModule {}
