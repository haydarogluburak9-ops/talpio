import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { AppConfigService } from '@config/app-config.service';

/**
 * Redis; önbellek, oturum/OTP saklama, rate limit sayaçları ve
 * ileride Socket.IO pub/sub adapter'ı için kullanılır.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: AppConfigService) {
    const { host, port, password, db } = config.redis;

    this.client = new Redis({
      host,
      port,
      db,
      ...(password ? { password } : {}),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 5_000),
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis hatası: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Redis bağlantısı kuruldu');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis bağlantısı kapatıldı');
  }

  /** Ham istemciye erişim; özel komutlar ve adapter kurulumu için. */
  get raw(): Redis {
    return this.client;
  }

  async ping(): Promise<boolean> {
    const response = await this.client.ping();
    return response === 'PONG';
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value === null ? null : (JSON.parse(value) as T);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  /**
   * Atomik sayaç. Rate limit ve deneme sayısı kontrollerinde kullanılır.
   * İlk artışta TTL kurulur, sonraki artışlarda pencere uzatılmaz.
   */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }
}
