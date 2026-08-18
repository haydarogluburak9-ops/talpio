/**
 * İş talebi akışının uçtan uca duman testi.
 *
 * Çalışan bir API ve tohumlanmış veritabanı gerektirir. Her çalıştırmada yeni
 * bir müşteri hesabı açar; mevcut demo verisini kirletmez.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(method, path, { body, token } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'IOS',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

console.log(`İş talebi duman testi — ${BASE}\n`);

console.log('Hazırlık: müşteri hesabı ve referans veriler');
const customer = await call('POST', '/auth/register', {
  body: {
    email: `jobs+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Talep Duman Testi',
    role: 'CUSTOMER',
  },
});
check('müşteri kaydı 201', customer.status === 201, `status=${customer.status}`);
const token = customer.json?.data?.tokens?.accessToken;

const categories = await call('GET', '/categories?withSubcategories=true');
const category = categories.json?.data?.[0];
check('kategori bulundu', Boolean(category?.id));

const cities = await call('GET', '/locations/cities');
const city = cities.json?.data?.[0];
check('şehir bulundu', Boolean(city?.id));

const districts = await call('GET', `/locations/districts?cityId=${city?.id}`);
const district = districts.json?.data?.[0];
check('ilçe bulundu', Boolean(district?.id));

console.log('\nTalep oluşturma:');
const created = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: category?.id,
    title: 'Mutfak musluğu damlatıyor',
    description: 'Evye altındaki bağlantıdan sürekli su sızıyor ve zemin ıslanıyor.',
    isUrgent: true,
    size: 'SMALL',
    budgetMinor: 150000,
    inspectionRequired: false,
    preferredTimeSlot: 'MORNING',
    preferredDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    address: {
      cityId: city?.id,
      districtId: district?.id,
      addressLine: 'Caferağa Mah. Moda Cad. No:12 D:4',
    },
    attachmentFileIds: [],
    publish: true,
  },
});
check('201 döner', created.status === 201, JSON.stringify(created.json)?.slice(0, 300));

const job = created.json?.data;
check('durum PUBLISHED', job?.status === 'PUBLISHED', job?.status);
check('yayın tarihi dolu', Boolean(job?.publishedAt));
check('son geçerlilik dolu', Boolean(job?.expiresAt));
check('bütçe kuruş olarak korunur', job?.budget?.amountMinor === 150000, JSON.stringify(job?.budget));
check('sahibine açık adres görünür', job?.address?.isFullyVisible === true);
check('açık adres döner', job?.address?.addressLine?.startsWith('Caferağa'), job?.address?.addressLine);
check('teklif sayısı sıfır', job?.offerCount === 0);

console.log('\nDoğrulama hataları:');
const shortTitle = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: category?.id,
    title: 'Kısa',
    description: 'Evye altındaki bağlantıdan sürekli su sızıyor ve zemin ıslanıyor.',
    address: { cityId: city?.id, districtId: district?.id },
  },
});
check('kısa başlık reddedilir', shortTitle.status === 400 || shortTitle.status === 422, `status=${shortTitle.status}`);

const wrongDistrict = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: category?.id,
    title: 'Mutfak musluğu damlatıyor',
    description: 'Evye altındaki bağlantıdan sürekli su sızıyor ve zemin ıslanıyor.',
    address: { cityId: city?.id, districtId: category?.id },
  },
});
check(
  'şehre ait olmayan ilçe reddedilir',
  wrongDistrict.json?.error?.code === 'VALIDATION_ERROR',
  `status=${wrongDistrict.status} code=${wrongDistrict.json?.error?.code}`,
);

console.log('\nListeleme:');
const list = await call('GET', '/jobs', { token });
check('200 döner', list.status === 200, JSON.stringify(list.json)?.slice(0, 300));
check('yeni talep listede', list.json?.data?.some((item) => item.id === job?.id));
check('sayfalama üst verisi var', typeof list.json?.meta?.totalPages === 'number');
check(
  'meta hasNextPage alanını taşır',
  typeof list.json?.meta?.hasNextPage === 'boolean',
  JSON.stringify(list.json?.meta),
);

const filtered = await call('GET', '/jobs?status=COMPLETED', { token });
check('durum süzgeci uygulanır', filtered.json?.data?.length === 0, JSON.stringify(filtered.json?.data)?.slice(0, 200));

console.log('\nDetay ve yetki:');
const detail = await call('GET', `/jobs/${job?.id}`, { token });
check('sahibi detayı görür', detail.status === 200 && detail.json?.data?.id === job?.id);

const anonymous = await call('GET', `/jobs/${job?.id}`);
check('kimliksiz erişim reddedilir', anonymous.status === 401, `status=${anonymous.status}`);

const stranger = await call('POST', '/auth/register', {
  body: {
    email: `stranger+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı Müşteri',
    role: 'CUSTOMER',
  },
});
const strangerToken = stranger.json?.data?.tokens?.accessToken;
const strangerView = await call('GET', `/jobs/${job?.id}`, { token: strangerToken });
check(
  'başka müşteri göremez',
  strangerView.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerView.status} code=${strangerView.json?.error?.code}`,
);

const strangerList = await call('GET', '/jobs', { token: strangerToken });
check(
  'başka müşterinin listesinde görünmez',
  !strangerList.json?.data?.some((item) => item.id === job?.id),
);

console.log('\nUsta havuzu:');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: process.env.DEMO_PASSWORD ?? 'Demo1234!' },
});
const providerToken = providerLogin.json?.data?.tokens?.accessToken;
check('demo satıcı girişi', providerLogin.status === 200, `status=${providerLogin.status}`);

if (providerToken) {
  const pool = await call('GET', '/jobs/available?matchMyServices=false', { token: providerToken });
  check('havuz 200 döner', pool.status === 200, JSON.stringify(pool.json)?.slice(0, 300));

  const poolJob = pool.json?.data?.find((item) => item.id === job?.id);
  check('yayındaki talep havuzda görünür', Boolean(poolJob));
  check('havuzda açık adres gizli', poolJob?.address?.isFullyVisible === false);
  check('havuzda adres satırı yok', poolJob?.address?.addressLine === undefined);
  check('havuzda ilçe adı görünür', typeof poolJob?.address?.districtName === 'string');

  const providerDetail = await call('GET', `/jobs/${job?.id}`, { token: providerToken });
  check('satıcı detayı görebilir', providerDetail.status === 200);
  check('satıcı detayında adres gizli', providerDetail.json?.data?.address?.isFullyVisible === false);

  const providerCreate = await call('POST', '/jobs', {
    token: providerToken,
    body: {
      categoryId: category?.id,
      title: 'Satıcı talep oluşturamaz',
      description: 'Bu istek rol denetimi tarafından reddedilmelidir çünkü rol satıcı.',
      address: { cityId: city?.id, districtId: district?.id },
    },
  });
  check('satıcı talep oluşturamaz', providerCreate.status === 403, `status=${providerCreate.status}`);
}

console.log('\nİptal:');
const cancelled = await call('POST', `/jobs/${job?.id}/cancel`, {
  token,
  body: { reason: 'Sorunu kendim çözdüm' },
});
check('iptal 201 döner', cancelled.status === 201, `status=${cancelled.status}`);
check('durum CANCELLED', cancelled.json?.data?.status === 'CANCELLED', cancelled.json?.data?.status);

const cancelAgain = await call('POST', `/jobs/${job?.id}/cancel`, { token });
check(
  'iptal edilmiş talep tekrar iptal edilemez',
  cancelAgain.json?.error?.code === 'JOB_INVALID_STATUS_TRANSITION',
  `status=${cancelAgain.status} code=${cancelAgain.json?.error?.code}`,
);

if (providerToken) {
  const poolAfter = await call('GET', '/jobs/available?matchMyServices=false', { token: providerToken });
  check(
    'iptal edilen talep havuzdan düşer',
    !poolAfter.json?.data?.some((item) => item.id === job?.id),
  );
}

console.log('\nTaslak:');
const draft = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: category?.id,
    title: 'Taslak olarak kaydedilen talep',
    description: 'Bu talep yayınlanmadan taslak olarak saklanmalı ve havuza düşmemelidir.',
    address: { cityId: city?.id, districtId: district?.id },
    publish: false,
  },
});
check('taslak oluşur', draft.json?.data?.status === 'DRAFT', draft.json?.data?.status);
check('taslakta yayın tarihi yok', draft.json?.data?.publishedAt === null);

const published = await call('POST', `/jobs/${draft.json?.data?.id}/publish`, { token });
check('taslak yayınlanır', published.json?.data?.status === 'PUBLISHED', published.json?.data?.status);
check('yayınla sonrası tarih dolar', Boolean(published.json?.data?.publishedAt));

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed > 0 ? 1 : 0);
