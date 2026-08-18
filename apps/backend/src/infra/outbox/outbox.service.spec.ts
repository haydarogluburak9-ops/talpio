import { DOMAIN_EVENT_TYPES } from '@talpio/types';

import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  const service = new OutboxService();

  it('aynı idempotencyKey ikinci yazımda created=false döner', async () => {
    const create = jest
      .fn()
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockResolvedValueOnce({ id: 'evt-1' });
    const findUnique = jest.fn().mockResolvedValue({ id: 'evt-1' });
    const tx = {
      outboxEvent: { create, findUnique },
    };

    const first = await service.write(tx as never, {
      type: DOMAIN_EVENT_TYPES.ORDER_CREATED,
      idempotencyKey: 'order.created:o1',
      tenantId: 'tenant-1',
      aggregateType: 'Order',
      aggregateId: 'o1',
      payload: { orderId: 'o1' },
      occurredAt: new Date().toISOString(),
    });

    expect(first).toEqual({ id: 'evt-1', created: false });
    expect(findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: 'order.created:o1' },
      select: { id: true },
    });
  });

  it('ilk yazımda created=true döner', async () => {
    const tx = {
      outboxEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-2' }),
        findUnique: jest.fn(),
      },
    };

    const result = await service.write(tx as never, {
      type: DOMAIN_EVENT_TYPES.ORDER_CREATED,
      idempotencyKey: 'order.created:o2',
      tenantId: 'tenant-1',
      aggregateType: 'Order',
      aggregateId: 'o2',
      payload: { orderId: 'o2' },
      occurredAt: new Date().toISOString(),
    });

    expect(result).toEqual({ id: 'evt-2', created: true });
  });
});
