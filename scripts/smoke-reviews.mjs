/**
 * Değerlendirme akışının uçtan uca duman testi.
 *
 * Sipariş zincirini onaya kadar yürütür, ardından müşterinin puanlamasını,
 * satıcının cevabını ve herkese açık liste kurallarını doğrular. Çalışan bir API
 * ve tohumlanmış veritabanı gerektirir; her çalıştırmada kendi müşterisini ve
 * talebini açar.
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

const RATINGS = {
  quality: 5,
  punctuality: 4,
  communication: 5,
  valueForMoney: 4,
  tidiness: 5,
};

/** Beş alt puanın ortalaması; sunucunun sakladığı `overallRating` bununla karşılaştırılır. */
const EXPECTED_OVERALL = 4.6;

/** Teklif kabul edilmiş yeni bir sipariş üretir. */
async function createOrderScenario(providerToken, sample, city, district) {
  const customer = await call('POST', '/auth/register', {
    body: {
      email: `reviews+${Date.now()}${Math.random().toString(36).slice(2, 6)}@talpio.test`,
      password: 'Guclu1Parola',
      fullName: 'Değerlendirme Duman Testi',
      role: 'CUSTOMER',
    },
  });

  const token = customer.json?.data?.tokens?.accessToken;
  if (!token) abort('Müşteri kaydı yapılamadı.', customer.json);

  const created = await call('POST', '/jobs', {
    token,
    body: {
      categoryId: sample.category.id,
      title: 'Değerlendirme akışı için açılan talep',
      description: 'Bu talep değerlendirme akışının uçtan uca doğrulanması için oluşturuldu.',
      size: 'SMALL',
      budgetMinor: 200000,
      preferredTimeSlot: 'FLEXIBLE',
      address: { cityId: city.id, districtId: district.id, addressLine: 'Test Sokak No: 9' },
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

/** Siparişi ödeme → başlatma → tamamlama → onay adımlarından geçirir. */
async function completeOrder(scenario, providerToken) {
  const paid = await call('POST', `/orders/${scenario.order.id}/pay`, {
    token: scenario.token,
    body: { idempotencyKey: `smoke-review-${scenario.order.id}` },
  });
  if (paid.status !== 201) abort('Ödeme alınamadı.', paid.json);

  const started = await call('POST', `/orders/${scenario.order.id}/start`, { token: providerToken });
  if (started.status !== 201) abort('İşe başlanamadı.', started.json);

  const completed = await call('POST', `/orders/${scenario.order.id}/complete`, {
    token: providerToken,
    body: { note: 'İş bitti, kontrol edebilirsiniz.' },
  });
  if (completed.status !== 201) abort('İş tamamlanamadı.', completed.json);

  const approved = await call('POST', `/orders/${scenario.order.id}/approve`, {
    token: scenario.token,
  });
  if (approved.status !== 201) abort('İş onaylanamadı.', approved.json);
}

console.log(`Değerlendirme duman testi — ${BASE}\n`);

console.log('Hazırlık: satıcı girişi ve hizmet kapsamı');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: DEMO_PASSWORD },
});
check('demo satıcı girişi', providerLogin.status === 200, `status=${providerLogin.status}`);
const providerToken = providerLogin.json?.data?.tokens?.accessToken;
if (!providerToken) abort('Satıcı girişi yapılamadı; değerlendirme akışı doğrulanamıyor.');

const providerProfile = await call('GET', '/providers/me', { token: providerToken });
const providerProfileId = providerProfile.json?.data?.id;
check('satıcı profili okunur', Boolean(providerProfileId), `status=${providerProfile.status}`);
if (!providerProfileId) abort('Satıcı profili bulunamadı.', providerProfile.json);

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

console.log('\nİş bitmeden değerlendirilemez:');
const pending = await createOrderScenario(providerToken, sample, city, district);
const earlyReview = await call('POST', '/reviews', {
  token: pending.token,
  body: { orderId: pending.order.id, ratings: RATINGS },
});
check(
  'ödenmemiş sipariş değerlendirilemez',
  earlyReview.json?.error?.code === 'REVIEW_NOT_ALLOWED',
  `status=${earlyReview.status} code=${earlyReview.json?.error?.code}`,
);

console.log('\nSipariş zinciri onaya kadar yürütülür:');
const main = await createOrderScenario(providerToken, sample, city, district);
await completeOrder(main, providerToken);
const orderAfterApprove = await call('GET', `/orders/${main.order.id}`, { token: main.token });
check(
  'sipariş COMPLETED durumunda',
  orderAfterApprove.json?.data?.status === 'COMPLETED',
  orderAfterApprove.json?.data?.status,
);

const beforeProfile = await call('GET', `/providers/${providerProfileId}`);
const beforeCount = beforeProfile.json?.data?.reviewCount ?? 0;
check('satıcı profili girişsiz okunur', beforeProfile.status === 200, `status=${beforeProfile.status}`);

console.log('\nDeğerlendirme:');
const wrongActor = await call('POST', '/reviews', {
  token: providerToken,
  body: { orderId: main.order.id, ratings: RATINGS },
});
check('satıcı kendi işini değerlendiremez', wrongActor.status === 403, `status=${wrongActor.status}`);

const badRating = await call('POST', '/reviews', {
  token: main.token,
  body: { orderId: main.order.id, ratings: { ...RATINGS, quality: 9 } },
});
check('aralık dışı puan reddedilir', badRating.status === 422, `status=${badRating.status}`);

const review = await call('POST', '/reviews', {
  token: main.token,
  body: {
    orderId: main.order.id,
    ratings: RATINGS,
    comment: 'Zamanında geldi, işini temiz yaptı.',
    photoFileIds: [],
  },
});
check('değerlendirme 201 döner', review.status === 201, `status=${review.status}`);
check('durum PUBLISHED', review.json?.data?.status === 'PUBLISHED', review.json?.data?.status);
check(
  'genel puan alt puanların ortalamasıdır',
  review.json?.data?.overallRating === EXPECTED_OVERALL,
  `overall=${review.json?.data?.overallRating}`,
);
check('yorum metni saklanır', review.json?.data?.comment === 'Zamanında geldi, işini temiz yaptı.');
check('cevap henüz yok', review.json?.data?.reply === null);
check(
  'müşteri adı maskelenir',
  typeof review.json?.data?.customer?.displayName === 'string' &&
    !review.json.data.customer.displayName.includes('Duman Testi'),
  review.json?.data?.customer?.displayName,
);
check(
  'müşteri e-postası dönmez',
  !JSON.stringify(review.json?.data?.customer ?? {}).includes('@'),
  JSON.stringify(review.json?.data?.customer),
);

const reviewId = review.json?.data?.id;
if (!reviewId) abort('Değerlendirme oluşturulamadı.', review.json);

const duplicate = await call('POST', '/reviews', {
  token: main.token,
  body: { orderId: main.order.id, ratings: RATINGS },
});
check(
  'aynı sipariş ikinci kez değerlendirilemez',
  duplicate.json?.error?.code === 'REVIEW_ALREADY_EXISTS',
  `status=${duplicate.status} code=${duplicate.json?.error?.code}`,
);

console.log('\nSatıcı ortalaması:');
const afterProfile = await call('GET', `/providers/${providerProfileId}`);
check(
  'yorum sayacı bir artar',
  afterProfile.json?.data?.reviewCount === beforeCount + 1,
  `${beforeCount} → ${afterProfile.json?.data?.reviewCount}`,
);
check(
  'ortalama puan hesaplanır',
  typeof afterProfile.json?.data?.averageRating === 'number' &&
    afterProfile.json.data.averageRating > 0,
  `average=${afterProfile.json?.data?.averageRating}`,
);

console.log('\nListeleme ve yetki:');
const mine = await call('GET', `/reviews?orderId=${main.order.id}`, { token: main.token });
check('müşteri yazdığı yorumu görür', mine.json?.data?.[0]?.id === reviewId, `status=${mine.status}`);

const providerList = await call('GET', '/reviews', { token: providerToken });
check(
  'satıcı aldığı yorumu görür',
  providerList.json?.data?.some((item) => item.id === reviewId),
  `status=${providerList.status}`,
);

const publicList = await call('GET', `/providers/${providerProfileId}/reviews`);
check(
  'herkese açık liste girişsiz okunur',
  publicList.status === 200 && publicList.json?.data?.some((item) => item.id === reviewId),
  `status=${publicList.status}`,
);
check(
  'herkese açık listede yalnızca yayınlanmış yorumlar var',
  (publicList.json?.data ?? []).every((item) => item.status === 'PUBLISHED'),
);
check('sayfalama üstverisi döner', typeof publicList.json?.meta?.total === 'number');

const stranger = await call('POST', '/auth/register', {
  body: {
    email: `reviewstranger+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı Müşteri',
    role: 'CUSTOMER',
  },
});
const strangerToken = stranger.json?.data?.tokens?.accessToken;
if (!strangerToken) abort('Yabancı müşteri kaydı yapılamadı; hız sınırına takılmış olabilir.', stranger.json);

const strangerList = await call('GET', '/reviews', { token: strangerToken });
check('ilgisiz müşterinin listesi boş', strangerList.json?.data?.length === 0);

const strangerReview = await call('POST', '/reviews', {
  token: strangerToken,
  body: { orderId: main.order.id, ratings: RATINGS },
});
check(
  'ilgisiz müşteri yabancı siparişi değerlendiremez',
  strangerReview.status === 403 || strangerReview.status === 409,
  `status=${strangerReview.status} code=${strangerReview.json?.error?.code}`,
);

console.log('\nSatıcı cevabı:');
const customerReply = await call('POST', `/reviews/${reviewId}/reply`, {
  token: main.token,
  body: { body: 'Müşteri cevap yazamamalı.' },
});
check('müşteri cevap yazamaz', customerReply.status === 403, `status=${customerReply.status}`);

const shortReply = await call('POST', `/reviews/${reviewId}/reply`, {
  token: providerToken,
  body: { body: 'a' },
});
check('çok kısa cevap reddedilir', shortReply.status === 422, `status=${shortReply.status}`);

const replied = await call('POST', `/reviews/${reviewId}/reply`, {
  token: providerToken,
  body: { body: 'Teşekkür ederiz, yine bekleriz.' },
});
check('cevap 201 döner', replied.status === 201, `status=${replied.status}`);
check(
  'cevap yorumla birlikte döner',
  replied.json?.data?.reply?.body === 'Teşekkür ederiz, yine bekleriz.',
  JSON.stringify(replied.json?.data?.reply),
);

const updatedReply = await call('POST', `/reviews/${reviewId}/reply`, {
  token: providerToken,
  body: { body: 'Teşekkür ederiz, iyi günlerde kullanın.' },
});
check('ikinci cevap mevcut cevabı günceller', updatedReply.status === 201, `status=${updatedReply.status}`);
check(
  'güncellenen metin döner',
  updatedReply.json?.data?.reply?.body === 'Teşekkür ederiz, iyi günlerde kullanın.',
  JSON.stringify(updatedReply.json?.data?.reply),
);

const otherProviderReply = await call('POST', `/reviews/${reviewId}/reply`, {
  token: strangerToken,
  body: { body: 'Yabancı cevabı.' },
});
check(
  'yorumla ilgisiz taraf cevap yazamaz',
  otherProviderReply.status === 403,
  `status=${otherProviderReply.status}`,
);

console.log('\nTekil yorum:');
const single = await call('GET', `/reviews/${reviewId}`, { token: main.token });
check('tekil yorum okunur', single.json?.data?.id === reviewId, `status=${single.status}`);
check('cevap tekil yanıtta da taşınır', Boolean(single.json?.data?.reply?.body));

const missing = await call('GET', '/reviews/00000000-0000-4000-8000-000000000000', {
  token: main.token,
});
check('olmayan yorum 404 döner', missing.status === 404, `status=${missing.status}`);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
