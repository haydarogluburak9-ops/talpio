import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '@infra/redis/redis.service';

import { WORKER_HEARTBEAT_KEY, WORKER_HEARTBEAT_TTL_SECONDS } from './queue.constants';

export interface WorkerHeartbeat {
  at: string;
  pid: number;
  queues: string[];
}

@Injectable()
export class WorkerHeartbeatService {
  private readonly logger = new Logger(WorkerHeartbeatService.name);

  constructor(private readonly redis: RedisService) {}

  async beat(queues: string[]): Promise<void> {
    const payload: WorkerHeartbeat = {
      at: new Date().toISOString(),
      pid: process.pid,
      queues,
    };
    await this.redis.set(WORKER_HEARTBEAT_KEY, payload, WORKER_HEARTBEAT_TTL_SECONDS);
  }

  async read(): Promise<WorkerHeartbeat | null> {
    return this.redis.get<WorkerHeartbeat>(WORKER_HEARTBEAT_KEY);
  }

  async isAlive(maxAgeMs = 30_000): Promise<boolean> {
    const beat = await this.read();
    if (!beat) return false;
    const age = Date.now() - new Date(beat.at).getTime();
    return Number.isFinite(age) && age >= 0 && age <= maxAgeMs;
  }

  startInterval(queues: string[], everyMs = 10_000): () => void {
    void this.beat(queues).catch((error: unknown) => {
      this.logger.warn({ error }, 'Worker nabzı yazılamadı');
    });
    const timer = setInterval(() => {
      void this.beat(queues).catch((error: unknown) => {
        this.logger.warn({ error }, 'Worker nabzı yazılamadı');
      });
    }, everyMs);
    return () => clearInterval(timer);
  }
}
