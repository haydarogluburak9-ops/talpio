import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

import { RedisService } from './redis.service';

/**
 * Rate limit sayaçlarını Redis'te tutar.
 *
 * Varsayılan bellek içi depo sayaçları süreç belleğinde tuttuğu için, API birden
 * fazla kopya hâlinde çalıştığında her kopya kendi limitini uygular: iki
 * instance ile pratik limit ikiye katlanır ve giriş denemesi sınırlaması
 * anlamını yitirir. Yeniden başlatma da sayaçları sıfırlar.
 *
 * Sayaç ile engel kaydı ayrı anahtarlarda tutulur; ikisini tek turda ve yarış
 * durumu olmadan güncellemek için tüm mantık Lua betiğiyle Redis üzerinde
 * çalıştırılır.
 */
const SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

-- Engelliyken sayaç artmaz; aksi hâlde istemci kendi engelini süresiz uzatırdı.
local blockPttl = redis.call('PTTL', blockKey)
if blockPttl > 0 then
  local blockedHits = tonumber(redis.call('GET', hitsKey) or '0')
  local blockedTtl = redis.call('PTTL', hitsKey)
  if blockedTtl < 0 then blockedTtl = 0 end
  return { blockedHits, blockedTtl, 1, blockPttl }
end

local hits = redis.call('INCR', hitsKey)
if hits == 1 then
  redis.call('PEXPIRE', hitsKey, ttl)
end

local pttl = redis.call('PTTL', hitsKey)
if pttl < 0 then
  -- TTL'siz kalmış sayaç kalıcı olur ve istemciyi sonsuza dek kilitler.
  redis.call('PEXPIRE', hitsKey, ttl)
  pttl = ttl
end

if hits > limit then
  redis.call('PSETEX', blockKey, blockDuration, '1')
  -- Sayaç engelle birlikte düşsün ki engel bitince pencere sıfırdan başlasın.
  redis.call('PEXPIRE', hitsKey, blockDuration)
  return { hits, pttl, 1, blockDuration }
end

return { hits, pttl, 0, 0 }
`;

/** Redis milisaniye döndürür; throttler saniye bekler. */
function toSeconds(milliseconds: number): number {
  return Math.ceil(milliseconds / 1000);
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:block:${throttlerName}:${key}`;

    const result = (await this.redis.raw.eval(
      SCRIPT,
      2,
      hitsKey,
      blockKey,
      String(ttl),
      String(limit),
      String(blockDuration),
    )) as [number, number, number, number];

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = result;

    return {
      totalHits,
      timeToExpire: toSeconds(timeToExpire),
      isBlocked: isBlocked === 1,
      timeToBlockExpire: toSeconds(timeToBlockExpire),
    };
  }
}
