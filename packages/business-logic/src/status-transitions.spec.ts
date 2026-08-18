import { JobRequestStatus, OfferStatus, OrderStatus } from '@talpio/types';

import {
  canAcceptOffer,
  canTransitionJobStatus,
  canTransitionOfferStatus,
  canTransitionOrderStatus,
  JOB_STATUS_TRANSITIONS,
} from './status-transitions';

describe('iş durumu geçişleri', () => {
  it('yayınlanmış bir iş teklif alındı durumuna geçebilir', () => {
    expect(
      canTransitionJobStatus(JobRequestStatus.PUBLISHED, JobRequestStatus.OFFERS_RECEIVED),
    ).toBe(true);
  });

  it('taslak iş doğrudan tamamlandı yapılamaz', () => {
    expect(canTransitionJobStatus(JobRequestStatus.DRAFT, JobRequestStatus.COMPLETED)).toBe(
      false,
    );
  });

  it('iptal edilmiş iş hiçbir duruma geçemez', () => {
    expect(JOB_STATUS_TRANSITIONS[JobRequestStatus.CANCELLED]).toHaveLength(0);
  });

  it('müşteri onayı beklenirken tamamlandıya geçilebilir', () => {
    expect(
      canTransitionJobStatus(
        JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
        JobRequestStatus.COMPLETED,
      ),
    ).toBe(true);
  });

  it('tamamlanmış iş yalnızca anlaşmazlığa taşınabilir', () => {
    expect(JOB_STATUS_TRANSITIONS[JobRequestStatus.COMPLETED]).toEqual([
      JobRequestStatus.DISPUTED,
    ]);
  });

  it('her durum için geçiş tanımı vardır', () => {
    for (const status of Object.values(JobRequestStatus)) {
      expect(JOB_STATUS_TRANSITIONS[status]).toBeDefined();
    }
  });
});

describe('teklif durumu geçişleri', () => {
  it('gönderilmiş teklif kabul edilebilir', () => {
    expect(canTransitionOfferStatus(OfferStatus.SUBMITTED, OfferStatus.ACCEPTED)).toBe(true);
  });

  it('kabul edilmiş teklif geri çekilemez', () => {
    expect(canTransitionOfferStatus(OfferStatus.ACCEPTED, OfferStatus.WITHDRAWN)).toBe(false);
  });

  it('reddedilmiş teklif tekrar kabul edilemez', () => {
    expect(canTransitionOfferStatus(OfferStatus.REJECTED, OfferStatus.ACCEPTED)).toBe(false);
  });
});

describe('sipariş durumu geçişleri', () => {
  it('ödeme alınmadan işe başlanamaz', () => {
    expect(
      canTransitionOrderStatus(OrderStatus.PENDING_PAYMENT, OrderStatus.IN_PROGRESS),
    ).toBe(false);
  });

  it('anlaşmazlık iade ile sonuçlanabilir', () => {
    expect(canTransitionOrderStatus(OrderStatus.DISPUTED, OrderStatus.REFUNDED)).toBe(true);
  });
});

describe('canAcceptOffer', () => {
  const now = new Date('2026-03-01T10:00:00.000Z');
  const future = new Date('2026-03-05T10:00:00.000Z');
  const past = new Date('2026-02-28T10:00:00.000Z');

  it('geçerli teklif kabul edilebilir', () => {
    expect(
      canAcceptOffer({
        offerStatus: OfferStatus.SUBMITTED,
        jobStatus: JobRequestStatus.OFFERS_RECEIVED,
        validUntil: future,
        now,
      }),
    ).toBe(true);
  });

  it('süresi dolmuş teklif kabul edilemez', () => {
    expect(
      canAcceptOffer({
        offerStatus: OfferStatus.SUBMITTED,
        jobStatus: JobRequestStatus.OFFERS_RECEIVED,
        validUntil: past,
        now,
      }),
    ).toBe(false);
  });

  it('satıcı zaten seçilmişse ikinci teklif kabul edilemez', () => {
    expect(
      canAcceptOffer({
        offerStatus: OfferStatus.SUBMITTED,
        jobStatus: JobRequestStatus.PROVIDER_SELECTED,
        validUntil: future,
        now,
      }),
    ).toBe(false);
  });

  it('geri çekilmiş teklif kabul edilemez', () => {
    expect(
      canAcceptOffer({
        offerStatus: OfferStatus.WITHDRAWN,
        jobStatus: JobRequestStatus.OFFERS_RECEIVED,
        validUntil: future,
        now,
      }),
    ).toBe(false);
  });
});
