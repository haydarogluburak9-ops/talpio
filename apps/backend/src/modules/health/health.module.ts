import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { AiHealthIndicator } from './indicators/ai.health';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { QueueHealthIndicator } from './indicators/queue.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
    QueueHealthIndicator,
    AiHealthIndicator,
  ],
})
export class HealthModule {}
