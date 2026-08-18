/**
 * Sipariş akışının uçtan uca duman testi.
 *
 * Teklif kabulünden iş onayına kadar zinciri yürütür: ödeme, işe başlama,
 * tamamlama, onay ve iptal kuralları. Çalışan bir API ve tohumlanmış
 * veritabanı gerektirir; her çalıştırmada kendi müşterisini ve talebini açar.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234!';

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

function abort(message, payload) {
  console.error(`\n${message}`);
  if (payload) console.error(JSON.stringify(payload).slice(0, 400));
  process.exit(1);
}

/** Teklif kabul edilmiş yeni bir sipariş üretir. */
async function createOrderScenario(providerToken, sample, city, district) {
  const customer = await call('POST', '/auth/register', {
    body: {
      email: `orders+${Date.now()}${Math.random().toString(36).slice(2, 6)}@talpio.test`,
      password: 'Guclu1Parola',
      fullName: 'Sipariş Duman Testi',
      role: 'CUSTOMER',
    },
  });

  const token = customer.json?.data?.tokens?.accessToken;
  if (!token) abort('Müşteri kaydı yapılamadı.', customer.json);

  const created = await call('POST', '/jobs', {
    token,
    body: {
      categoryId: sample.category.id,
      title: 'Sipariş akışı için açılan talep',
      description: 'Bu talep sipariş akışının uçtan uca doğrulanması için oluşturuldu.',
      size: 'SMALL',
      budgetMinor: 200000,
      preferredTimeSlot: 'FLEXIBLE',
      address: { cityId: city.id, districtId: district.id, addressLine: 'Test Sokak No: 7' },
      attachmentFileIds: [],
      publish: true,
    },
  });

  const job = created.json?.data;
  if (job?.status !== 'PUBLISHED') abort('Talep yayınlanamadı.', created.json);

  const offerCreated = await call('POST', '/offers', {
    token: providerToken,
    body: {
      jobRequestId: job.id,
      amountMinor: 180000,
      priceType: 'FIXED',
      estimatedDurationMinutes: 120,
      materialsIncluded: true,
      validityHours: 48,
    },
  });

  if (offerCreated.status !== 201) abort('Teklif oluşturulamadı.', offerCreated.json);

  const accepted = await call('POST', `/offers/${offerCreated.json.data.id}/accept`, {
    token,
    body: {},
  });

  if (accepted.status !== 201) abort('Teklif kabul edilemedi.', accepted.json);

  const orders = await call('GET', '/orders', { token });
  const order = orders.json?.data?.find((item) => item.jobRequestId === job.id);
  if (!order) abort('Kabul sonrası sipariş bulunamadı.', orders.json);

  return { token, job, order };
}

console.log(`Sipariş duman testi — ${BASE}\n`);

console.log('Hazırlık: satıcı girişi ve hizmet kapsamı');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: DEMO_PASSWORD },
});
check('demo satıcı girişi', providerLogin.status === 200, `status=${providerLogin.status}`);
const providerToken = providerLogin.json?.data?.tokens?.accessToken;
if (!providerToken) abort('Satıcı girişi yapılamadı; sipariş akışı doğrulanamıyor.');

const pool = await call('GET', '/jobs/available?matchMyServices=true&limit=1', {
  token: providerToken,
});
const sample = pool.json?.data?.[0];
check('satıcının kapsamında örnek iş var', Boolean(sample?.id), 'havuz boş');
if (!sample) abort('Satıcının hizmet kapsamında açık iş yok; tohumlama gerekiyor.');

const cities = await call('GET', '/locations/cities');
const city = cities.json?.data?.find((item) => item.name === sample.address.cityName);
const districts = await call('GET', `/locations/districts?cityId=${city?.id}`);
const district = districts.json?.data?.find((item) => item.name === sample.address.districtName);
check('örnek işin şehir/ilçesi çözüldü', Boolean(city?.id && district?.id));
if (!city || !district) abort('Şehir/ilçe çözülemedi.');

console.log('\nTeklif kabulünde sipariş açılır:');
const main = await createOrderScenario(providerToken, sample, city, district);
check('sipariş oluşur', Boolean(main.order?.id));
check('durum PENDING_PAYMENT', main.order?.status === 'PENDING_PAYMENT', main.order?.status);
check('tutar teklifle aynı', main.order?.total?.amountMinor === 180000, JSON.stringify(main.order?.total));
check(
  'komisyon ve hakediş brütü bölüşür',
  main.order?.commission?.amountMinor + main.order?.providerPayout?.amountMinor === 180000,
  `${main.order?.commission?.amountMinor} + ${main.order?.providerPayout?.amountMinor}`,
);
check('iş özeti taşınır', main.order?.job?.title === 'Sipariş akışı için açılan talep');
check('satıcı özeti taşınır', typeof main.order?.provider?.displayName === 'string');

console.log('\nListeleme ve yetki:');
const providerOrders = await call('GET', '/orders', { token: providerToken });
check(
  'satıcı üstlendiği siparişi görür',
  providerOrders.json?.data?.some((item) => item.id === main.order.id),
  `status=${providerOrders.status}`,
);

const stranger = await call('POST', '/auth/register', {
  body: {
    email: `stranger+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı Müşteri',
    role: 'CUSTOMER',
  },
});
const strangerToken = stranger.json?.data?.tokens?.accessToken;

const strangerView = await call('GET', `/orders/${main.order.id}`, { token: strangerToken });
check(
  'ilgisiz müşteri siparişi göremez',
  strangerView.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerView.status} code=${strangerView.json?.error?.code}`,
);

const strangerOrders = await call('GET', '/orders', { token: strangerToken });
check('ilgisiz müşterinin listesi boş', strangerOrders.json?.data?.length === 0);

const providerJobView = await call('GET', `/jobs/${main.job.id}`, { token: providerToken });
check(
  'üstlenen satıcı talebi görmeye devam eder',
  providerJobView.status === 200,
  `status=${providerJobView.status}`,
);
check(
  'üstlenen satıcıya açık adres gösterilir',
  providerJobView.json?.data?.address?.addressLine === 'Test Sokak No: 7',
  JSON.stringify(providerJobView.json?.data?.address),
);

console.log('\nSıra kuralları:');
const earlyStart = await call('POST', `/orders/${main.order.id}/start`, { token: providerToken });
check(
  'ödeme öncesi işe başlanamaz',
  earlyStart.json?.error?.code === 'ORDER_INVALID_STATUS_TRANSITION',
  `status=${earlyStart.status} code=${earlyStart.json?.error?.code}`,
);

const providerPay = await call('POST', `/orders/${main.order.id}/pay`, { token: providerToken });
check('satıcı ödeme yapamaz', providerPay.status === 403, `status=${providerPay.status}`);

console.log('\nÖdeme:');
const paid = await call('POST', `/orders/${main.order.id}/pay`, {
  token: main.token,
  body: { idempotencyKey: `smoke-${main.order.id}` },
});
check('ödeme 201 döner', paid.status === 201, `status=${paid.status}`);
check('durum PAID', paid.json?.data?.status === 'PAID', paid.json?.data?.status);

const jobAfterPay = await call('GET', `/jobs/${main.job.id}`, { token: main.token });
check(
  'iş takvime alınır',
  jobAfterPay.json?.data?.status === 'SCHEDULED',
  jobAfterPay.json?.data?.status,
);

const repeatPay = await call('POST', `/orders/${main.order.id}/pay`, {
  token: main.token,
  body: { idempotencyKey: `smoke-${main.order.id}` },
});
check('aynı anahtarla ikinci ödeme çift tahsilat yapmaz', repeatPay.status === 201, `status=${repeatPay.status}`);
check('tekrar isteğinde durum korunur', repeatPay.json?.data?.status === 'PAID');

console.log('\nİşe başlama ve tamamlama:');
const earlyApprove = await call('POST', `/orders/${main.order.id}/approve`, { token: main.token });
check(
  'iş bitmeden onaylanamaz',
  earlyApprove.json?.error?.code === 'ORDER_INVALID_STATUS_TRANSITION',
  `code=${earlyApprove.json?.error?.code}`,
);

const started = await call('POST', `/orders/${main.order.id}/start`, { token: providerToken });
check('işe başlama 201 döner', started.status === 201, `status=${started.status}`);
check('durum IN_PROGRESS', started.json?.data?.status === 'IN_PROGRESS', started.json?.data?.status);
check('başlama tarihi dolar', Boolean(started.json?.data?.startedAt));

const lateCancel = await call('POST', `/orders/${main.order.id}/cancel`, { token: main.token });
check(
  'iş başladıktan sonra iptal edilemez',
  lateCancel.json?.error?.code === 'ORDER_INVALID_STATUS_TRANSITION',
  `code=${lateCancel.json?.error?.code}`,
);

const completed = await call('POST', `/orders/${main.order.id}/complete`, {
  token: providerToken,
  body: { note: 'Sifon değişti, sızdırma yok.' },
});
check('tamamlama 201 döner', completed.status === 201, `status=${completed.status}`);
check(
  'durum AWAITING_APPROVAL',
  completed.json?.data?.status === 'AWAITING_APPROVAL',
  completed.json?.data?.status,
);

const customerComplete = await call('POST', `/orders/${main.order.id}/complete`, {
  token: main.token,
});
check('müşteri işi tamamlayamaz', customerComplete.status === 403, `status=${customerComplete.status}`);

console.log('\nOnay:');
const providerApprove = await call('POST', `/orders/${main.order.id}/approve`, {
  token: providerToken,
});
check('satıcı kendi işini onaylayamaz', providerApprove.status === 403, `status=${providerApprove.status}`);

const approved = await call('POST', `/orders/${main.order.id}/approve`, { token: main.token });
check('onay 201 döner', approved.status === 201, `status=${approved.status}`);
check('durum COMPLETED', approved.json?.data?.status === 'COMPLETED', approved.json?.data?.status);
check('onay tarihi dolar', Boolean(approved.json?.data?.approvedAt));

const jobAfterApprove = await call('GET', `/jobs/${main.job.id}`, { token: main.token });
check(
  'iş tamamlandı durumuna geçer',
  jobAfterApprove.json?.data?.status === 'COMPLETED',
  jobAfterApprove.json?.data?.status,
);

const doubleApprove = await call('POST', `/orders/${main.order.id}/approve`, { token: main.token });
check(
  'tamamlanan sipariş tekrar onaylanamaz',
  doubleApprove.json?.error?.code === 'ORDER_INVALID_STATUS_TRANSITION',
  `code=${doubleApprove.json?.error?.code}`,
);

console.log('\nİptal:');
const second = await createOrderScenario(providerToken, sample, city, district);
const cancelled = await call('POST', `/orders/${second.order.id}/cancel`, {
  token: second.token,
  body: { reason: 'Planım değişti' },
});
check('iptal 201 döner', cancelled.status === 201, `status=${cancelled.status}`);
check('durum CANCELLED', cancelled.json?.data?.status === 'CANCELLED', cancelled.json?.data?.status);
check('iptal gerekçesi saklanır', cancelled.json?.data?.cancellationReason === 'Planım değişti');

const jobAfterCancel = await call('GET', `/jobs/${second.job.id}`, { token: second.token });
check(
  'iptalde talep de kapanır',
  jobAfterCancel.json?.data?.status === 'CANCELLED',
  jobAfterCancel.json?.data?.status,
);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
