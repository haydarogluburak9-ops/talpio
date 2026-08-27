/**
 * Bildirim akışının uçtan uca duman testi.
 *
 * Kayıt → talep → teklif → kabul → ödeme → başlat → tamamla → onay → mesaj →
 * değerlendirme zincirinde her adımda doğru kullanıcıya doğru türün düştüğünü
 * doğrular. Okundu işaretleme ve cihaz jetonu tekrarını da kapsar.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'yerel_demo_parolasi';
// Yetkili hesaplar vitrin hesaplarıyla aynı parolayı paylaşmaz.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'yerel_admin_parolasi';

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

async function listTypes(token) {
  const response = await call('GET', '/notifications?limit=50', { token });
  const items = response.json?.data ?? [];
  return items.map((item) => item.type);
}

async function hasType(token, type) {
  const types = await listTypes(token);
  return types.includes(type);
}

function messageKey(suffix) {
  return `smoke-notif-${Date.now()}-${suffix}`;
}

console.log(`Bildirim duman testi — ${BASE}\n`);

console.log('Hazırlık: satıcı girişi ve hizmet kapsamı');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: DEMO_PASSWORD },
});
check('demo satıcı girişi', providerLogin.status === 200, `status=${providerLogin.status}`);
const providerToken = providerLogin.json?.data?.tokens?.accessToken;
if (!providerToken) abort('Satıcı girişi yapılamadı.');

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

const providerBeforeJob = await listTypes(providerToken);

console.log('\nKayıt ve talep:');
const customer = await call('POST', '/auth/register', {
  body: {
    email: `notif+${Date.now()}${Math.random().toString(36).slice(2, 6)}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Bildirim Duman Testi',
    role: 'CUSTOMER',
  },
});
const customerToken = customer.json?.data?.tokens?.accessToken;
if (!customerToken) abort('Müşteri kaydı yapılamadı.', customer.json);
check('müşteri kaydı', Boolean(customerToken));

const created = await call('POST', '/jobs', {
  token: customerToken,
  body: {
    categoryId: sample.category.id,
    title: 'Bildirim akışı için açılan talep',
    description: 'Bu talep bildirim akışının uçtan uca doğrulanması için oluşturuldu.',
    size: 'SMALL',
    budgetMinor: 200000,
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city.id, districtId: district.id, addressLine: 'Test Sokak No: 11' },
    attachmentFileIds: [],
    publish: true,
  },
});
const job = created.json?.data;
check('talep yayınlandı', job?.status === 'PUBLISHED', job?.status);
if (!job) abort('Talep oluşturulamadı.', created.json);

const providerAfterJob = await listTypes(providerToken);
check(
  'eşleşen satıcıya JOB_MATCHED düşer',
  providerAfterJob.includes('JOB_MATCHED') &&
    providerAfterJob.filter((type) => type === 'JOB_MATCHED').length >
      providerBeforeJob.filter((type) => type === 'JOB_MATCHED').length,
);

console.log('\nTeklif:');
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
check('teklif oluşturulur', offerCreated.status === 201, `status=${offerCreated.status}`);
if (offerCreated.status !== 201) abort('Teklif oluşturulamadı.', offerCreated.json);
const offerId = offerCreated.json.data.id;

check('müşteriye OFFER_RECEIVED düşer', await hasType(customerToken, 'OFFER_RECEIVED'));

console.log('\nKabul:');
const accepted = await call('POST', `/offers/${offerId}/accept`, {
  token: customerToken,
  body: {},
});
check('teklif kabul edilir', accepted.status === 201, `status=${accepted.status}`);
if (accepted.status !== 201) abort('Teklif kabul edilemedi.', accepted.json);

const orders = await call('GET', '/orders', { token: customerToken });
const order = orders.json?.data?.find((item) => item.jobRequestId === job.id);
check('sipariş oluşur', Boolean(order?.id));
if (!order) abort('Sipariş bulunamadı.', orders.json);

check('satıcıya OFFER_ACCEPTED düşer', await hasType(providerToken, 'OFFER_ACCEPTED'));

console.log('\nÖdeme → başlat → tamamla → onay:');
const paid = await call('POST', `/orders/${order.id}/pay`, {
  token: customerToken,
  body: { idempotencyKey: `notif-pay-${Date.now()}` },
});
check('ödeme alınır', paid.status === 200 || paid.status === 201, `status=${paid.status}`);
check('satıcıya PAYMENT_RECEIVED düşer', await hasType(providerToken, 'PAYMENT_RECEIVED'));

const started = await call('POST', `/orders/${order.id}/start`, { token: providerToken });
check('iş başlar', started.status === 200 || started.status === 201, `status=${started.status}`);
check('müşteriye JOB_STARTED düşer', await hasType(customerToken, 'JOB_STARTED'));

const completed = await call('POST', `/orders/${order.id}/complete`, {
  token: providerToken,
  body: {},
});
check('iş tamamlanır', completed.status === 200 || completed.status === 201, `status=${completed.status}`);
check('müşteriye JOB_COMPLETED düşer', await hasType(customerToken, 'JOB_COMPLETED'));

const approved = await call('POST', `/orders/${order.id}/approve`, { token: customerToken });
check('iş onaylanır', approved.status === 200 || approved.status === 201, `status=${approved.status}`);
check('satıcıya PAYOUT_SENT düşer', await hasType(providerToken, 'PAYOUT_SENT'));
check('müşteriye REVIEW_REQUESTED düşer', await hasType(customerToken, 'REVIEW_REQUESTED'));

console.log('\nMesaj:');
const conversation = await call('POST', '/messages/conversations', {
  token: customerToken,
  body: { orderId: order.id },
});
const conversationId = conversation.json?.data?.id;
check('sohbet açılır', Boolean(conversationId), `status=${conversation.status}`);
if (!conversationId) abort('Sohbet açılamadı.', conversation.json);

const sent = await call('POST', `/messages/conversations/${conversationId}/messages`, {
  token: customerToken,
  body: {
    type: 'TEXT',
    body: 'Merhaba, yarın uygun musunuz?',
    clientMessageId: messageKey('1'),
    attachmentFileIds: [],
  },
});
check('mesaj gönderilir', sent.status === 201, `status=${sent.status}`);
check('satıcıya MESSAGE_RECEIVED düşer', await hasType(providerToken, 'MESSAGE_RECEIVED'));

console.log('\nDeğerlendirme:');
const review = await call('POST', '/reviews', {
  token: customerToken,
  body: {
    orderId: order.id,
    ratings: {
      quality: 5,
      punctuality: 4,
      communication: 5,
      valueForMoney: 4,
      tidiness: 5,
    },
    comment: 'Bildirim duman testi değerlendirmesi.',
    photoFileIds: [],
  },
});
check('değerlendirme yazılır', review.status === 201, `status=${review.status}`);
check('satıcıya REVIEW_RECEIVED düşer', await hasType(providerToken, 'REVIEW_RECEIVED'));

console.log('\nOkundu ve cihaz jetonu:');
const feed = await call('GET', '/notifications?limit=50', { token: customerToken });
const unreadBefore = feed.json?.meta?.unreadCount ?? 0;
const firstUnread = (feed.json?.data ?? []).find((item) => !item.readAt);
check('müşterinin okunmamış bildirimi var', unreadBefore > 0 && Boolean(firstUnread?.id));

if (firstUnread?.id) {
  const marked = await call('POST', `/notifications/${firstUnread.id}/read`, {
    token: customerToken,
  });
  check('tek bildirim okundu işaretlenir', Boolean(marked.json?.data?.readAt));
}

const markAll = await call('POST', '/notifications/read-all', { token: customerToken });
check(
  'tümünü okundu işaretler',
  typeof markAll.json?.data?.updatedCount === 'number',
  JSON.stringify(markAll.json?.data),
);

const unreadAfter = await call('GET', '/notifications/unread-count', { token: customerToken });
check('okunmamış sayacı sıfırlanır', unreadAfter.json?.data?.unreadCount === 0);

const deviceToken = `smoke-device-${Date.now()}`;
const registered = await call('POST', '/notifications/device-tokens', {
  token: customerToken,
  body: { token: deviceToken, platform: 'IOS', locale: 'tr' },
});
check('cihaz jetonu kaydedilir', registered.status === 201 || registered.status === 200);

const reregistered = await call('POST', '/notifications/device-tokens', {
  token: customerToken,
  body: { token: deviceToken, platform: 'IOS', locale: 'tr' },
});
check(
  'aynı jeton tekrarı çift kayıt oluşturmaz',
  reregistered.json?.data?.token === deviceToken &&
    reregistered.json?.data?.id === registered.json?.data?.id,
);

const removed = await call('DELETE', '/notifications/device-tokens', {
  token: customerToken,
  body: { token: deviceToken },
});
check('cihaz jetonu silinir', removed.json?.data?.removed === true);

console.log('\nMock outbox:');
const outbox = await call('GET', '/notifications/mock-outbox', { token: customerToken });
check(
  'mock outbox okunur',
  outbox.status === 200 && Array.isArray(outbox.json?.data),
  `status=${outbox.status}`,
);
if (Array.isArray(outbox.json?.data)) {
  check('outbox en az bir gönderim taşır', outbox.json.data.length > 0, `len=${outbox.json.data.length}`);
}

console.log('\nAdmin bildirim listesi:');
const adminLogin = await call('POST', '/auth/login', {
  body: { email: 'admin@talpio.com', password: ADMIN_PASSWORD },
});
const adminToken = adminLogin.json?.data?.tokens?.accessToken;
if (adminToken) {
  const adminList = await call('GET', '/admin/notifications?limit=5', { token: adminToken });
  check(
    'admin bildirim listesi',
    adminList.status === 200 && Array.isArray(adminList.json?.data),
    `status=${adminList.status}`,
  );
} else {
  check('admin girişi (atlandı)', false, 'admin@talpio.com bulunamadı');
}

console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı`);
process.exit(failed > 0 ? 1 : 0);
