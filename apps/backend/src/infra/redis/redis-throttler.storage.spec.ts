import type { RedisService } from './redis.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';

function createStorage(result: [number, number, number, number]) {
  const evalMock = jest.fn().mockResolvedValue(result);
  const redis = { raw: { eval: evalMock } } as unknown as RedisService;

  return { storage: new RedisThrottlerStorage(redis), evalMock };
}

describe('RedisThrottlerStorage', () => {
  it('Redis milisaniyesini throttler saniyesine çevirir', async () => {
    const { storage } = createStorage([3, 45_200, 0, 0]);

    const record = await storage.increment('anahtar', 60_000, 10, 30_000, 'default');

    expect(record.totalHits).toBe(3);
    // Yukarı yuvarlanır: kalan süre 0 görünüp istemciyi erken denemeye itmemeli.
    expect(record.timeToExpire).toBe(46);
    expect(record.isBlocked).toBe(false);
    expect(record.timeToBlockExpire).toBe(0);
  });

  it('engel durumunu ve kalan engel süresini aktarır', async () => {
    const { storage } = createStorage([11, 20_000, 1, 25_000]);

    const record = await storage.increment('anahtar', 60_000, 10, 30_000, 'auth');

    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(25);
  });

  it('sayaç ve engel anahtarlarını throttler adına göre ayırır', async () => {
    const { storage, evalMock } = createStorage([1, 60_000, 0, 0]);

    await storage.increment('abc', 60_000, 10, 30_000, 'auth');

    const [, keyCount, hitsKey, blockKey, ttl, limit, blockDuration] = evalMock.mock.calls[0] as [
      string,
      number,
      string,
      string,
      string,
      string,
      string,
    ];

    expect(keyCount).toBe(2);
    expect(hitsKey).toBe('throttle:auth:abc');
    expect(blockKey).toBe('throttle:block:auth:abc');
    expect([ttl, limit, blockDuration]).toEqual(['60000', '10', '30000']);
  });
});
