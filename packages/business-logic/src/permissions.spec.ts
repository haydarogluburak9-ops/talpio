import { JobRequestStatus, OrderStatus, Permission, UserRole } from '@ustapilot/types';

import {
  canAccessConversation,
  canReviewOrder,
  canSubmitOffer,
  canViewFullAddress,
  canViewJob,
  hasPermission,
  permissionsForRole,
} from './permissions';

const customer = { userId: 'user-customer', role: UserRole.CUSTOMER };
const provider = {
  userId: 'user-provider',
  role: UserRole.PROVIDER,
  providerProfileId: 'provider-1',
};
const otherProvider = {
  userId: 'user-provider-2',
  role: UserRole.PROVIDER,
  providerProfileId: 'provider-2',
};
const support = { userId: 'user-support', role: UserRole.SUPPORT };

describe('rol izin matrisi', () => {
  it('müşteri iş oluşturabilir', () => {
    expect(hasPermission(UserRole.CUSTOMER, Permission.JOB_CREATE)).toBe(true);
  });

  it('müşteri teklif veremez', () => {
    expect(hasPermission(UserRole.CUSTOMER, Permission.OFFER_CREATE)).toBe(false);
  });

  it('usta başkasının işlerini listeleyemez', () => {
    expect(hasPermission(UserRole.PROVIDER, Permission.JOB_READ_ANY)).toBe(false);
  });

  it('destek yetkilisi ayar değiştiremez', () => {
    expect(hasPermission(UserRole.SUPPORT, Permission.SETTINGS_MANAGE)).toBe(false);
  });

  it('süper admin tüm izinlere sahiptir', () => {
    expect(permissionsForRole(UserRole.SUPER_ADMIN)).toHaveLength(
      Object.values(Permission).length,
    );
  });
});

describe('canViewJob', () => {
  const job = {
    customerId: 'user-customer',
    status: JobRequestStatus.PUBLISHED,
    selectedProviderProfileId: null,
    offeredProviderProfileIds: [],
  };

  it('iş sahibi kendi işini görür', () => {
    expect(canViewJob(customer, job)).toBe(true);
  });

  it('usta yayındaki işi havuzda görür', () => {
    expect(canViewJob(provider, job)).toBe(true);
  });

  it('usta seçildikten sonra havuzdaki diğer ustalar işi göremez', () => {
    expect(
      canViewJob(otherProvider, {
        ...job,
        status: JobRequestStatus.PROVIDER_SELECTED,
        selectedProviderProfileId: 'provider-1',
      }),
    ).toBe(false);
  });

  it('teklif vermiş usta iş kapandıktan sonra da görebilir', () => {
    expect(
      canViewJob(provider, {
        ...job,
        status: JobRequestStatus.PROVIDER_SELECTED,
        selectedProviderProfileId: 'provider-2',
        offeredProviderProfileIds: ['provider-1', 'provider-2'],
      }),
    ).toBe(true);
  });

  it('destek yetkilisi her işi görebilir', () => {
    expect(canViewJob(support, { ...job, status: JobRequestStatus.COMPLETED })).toBe(true);
  });
});

describe('canViewFullAddress', () => {
  const job = {
    customerId: 'user-customer',
    status: JobRequestStatus.PUBLISHED,
    selectedProviderProfileId: null,
    offeredProviderProfileIds: ['provider-1'],
  };

  it('havuzdaki usta açık adresi göremez', () => {
    expect(canViewFullAddress(provider, job)).toBe(false);
  });

  it('teklifi kabul edilen usta açık adresi görür', () => {
    expect(
      canViewFullAddress(provider, { ...job, selectedProviderProfileId: 'provider-1' }),
    ).toBe(true);
  });

  it('iş sahibi kendi adresini görür', () => {
    expect(canViewFullAddress(customer, job)).toBe(true);
  });
});

describe('canSubmitOffer', () => {
  const base = {
    actor: provider,
    jobStatus: JobRequestStatus.PUBLISHED,
    jobCategoryId: 'cat-1',
    jobDistrictId: 'district-1',
    providerIsVerified: true,
    providerCategoryIds: ['cat-1'],
    providerDistrictIds: ['district-1'],
    hasExistingOffer: false,
  };

  it('uygun usta teklif verebilir', () => {
    expect(canSubmitOffer(base).allowed).toBe(true);
  });

  it('doğrulanmamış usta teklif veremez', () => {
    expect(canSubmitOffer({ ...base, providerIsVerified: false })).toEqual({
      allowed: false,
      reason: 'NOT_VERIFIED',
    });
  });

  it('hizmet bölgesi dışındaki usta teklif veremez', () => {
    expect(canSubmitOffer({ ...base, providerDistrictIds: ['district-9'] })).toEqual({
      allowed: false,
      reason: 'OUT_OF_SERVICE_AREA',
    });
  });

  it('farklı kategorideki usta teklif veremez', () => {
    expect(canSubmitOffer({ ...base, providerCategoryIds: ['cat-9'] })).toEqual({
      allowed: false,
      reason: 'CATEGORY_MISMATCH',
    });
  });

  it('kapanmış işe teklif verilemez', () => {
    expect(canSubmitOffer({ ...base, jobStatus: JobRequestStatus.COMPLETED })).toEqual({
      allowed: false,
      reason: 'JOB_NOT_OPEN',
    });
  });

  it('aynı işe ikinci teklif verilemez', () => {
    expect(canSubmitOffer({ ...base, hasExistingOffer: true })).toEqual({
      allowed: false,
      reason: 'DUPLICATE_OFFER',
    });
  });

  it('müşteri teklif veremez', () => {
    expect(canSubmitOffer({ ...base, actor: customer }).allowed).toBe(false);
  });
});

describe('canReviewOrder', () => {
  const base = {
    actor: customer,
    orderCustomerId: 'user-customer',
    orderStatus: OrderStatus.COMPLETED,
    hasPaymentRecord: true,
    hasExistingReview: false,
  };

  it('tamamlanmış ve ödemesi olan iş değerlendirilebilir', () => {
    expect(canReviewOrder(base)).toBe(true);
  });

  it('tamamlanmamış iş değerlendirilemez', () => {
    expect(canReviewOrder({ ...base, orderStatus: OrderStatus.IN_PROGRESS })).toBe(false);
  });

  it('ödeme kaydı olmayan iş değerlendirilemez', () => {
    expect(canReviewOrder({ ...base, hasPaymentRecord: false })).toBe(false);
  });

  it('ikinci kez yorum yapılamaz', () => {
    expect(canReviewOrder({ ...base, hasExistingReview: true })).toBe(false);
  });

  it('başkasının işi değerlendirilemez', () => {
    expect(canReviewOrder({ ...base, orderCustomerId: 'someone-else' })).toBe(false);
  });
});

describe('canAccessConversation', () => {
  it('katılımcı sohbete erişir', () => {
    expect(canAccessConversation(customer, ['user-customer', 'user-provider'])).toBe(true);
  });

  it('ilgisiz kullanıcı erişemez', () => {
    expect(canAccessConversation(otherProvider, ['user-customer', 'user-provider'])).toBe(false);
  });

  it('destek yetkilisi şikâyet kapsamında erişebilir', () => {
    expect(canAccessConversation(support, ['user-customer', 'user-provider'])).toBe(true);
  });
});
