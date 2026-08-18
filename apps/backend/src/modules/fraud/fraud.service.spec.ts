import { FraudFlagReason, FraudFlagStatus } from '@talpio/types';

import type { PrismaService } from '@infra/prisma/prisma.service';

import { FraudService } from './fraud.service';

function createPrisma(count: number) {
  return {
    jobRequest: { count: jest.fn().mockResolvedValue(count) },
    commerceRequest: { count: jest.fn().mockResolvedValue(0) },
    offer: { count: jest.fn().mockResolvedValue(0) },
    requestOffer: { count: jest.fn().mockResolvedValue(0) },
    message: { count: jest.fn().mockResolvedValue(0) },
    fraudFlag: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'flag-1' }),
    },
  };
}

describe('FraudService', () => {
  it('eşik altındaysa bayrak yazmaz', async () => {
    const prisma = createPrisma(3);
    const service = new FraudService(prisma as unknown as PrismaService);

    await service.observe('user-1', FraudFlagReason.MANY_REQUESTS, 'request', 'req-1');

    expect(prisma.fraudFlag.create).not.toHaveBeenCalled();
  });

  it('eşikte OPEN bayrak yazar, ban uygulamaz', async () => {
    const prisma = createPrisma(20);
    const service = new FraudService(prisma as unknown as PrismaService);

    await service.observe('user-1', FraudFlagReason.MANY_REQUESTS, 'request', 'req-1');

    expect(prisma.fraudFlag.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        reason: FraudFlagReason.MANY_REQUESTS,
        status: FraudFlagStatus.OPEN,
      }),
    });
  });

  it('açık bayrak varken tekrar yazmaz', async () => {
    const prisma = createPrisma(50);
    prisma.fraudFlag.findFirst.mockResolvedValue({ id: 'existing' });
    const service = new FraudService(prisma as unknown as PrismaService);

    await service.observe('user-1', FraudFlagReason.MANY_REQUESTS, 'request', 'req-1');

    expect(prisma.fraudFlag.create).not.toHaveBeenCalled();
  });
});
