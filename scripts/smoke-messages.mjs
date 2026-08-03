/**
 * Mesajlaşma akışının uçtan uca duman testi.
 *
 * Sipariş üzerinden sohbet açar; mesaj gönderme, okundu işaretleme, tekrar
 * koruması, iletişim bilgisi işaretlemesi ve yetki kurallarını doğrular.
 * Çalışan bir API ve tohumlanmış veritabanı gerektirir.
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

function messageKey(suffix) {
  return `smoke-${Date.now()}-${suffix}`;
}

console.log(`Mesajlaşma duman testi — ${BASE}\n`);

console.log('Hazırlık: sipariş oluştur');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'usta@ustapilot.com', password: DEMO_PASSWORD },
});
const providerToken = providerLogin.json?.data?.tokens?.accessToken;
if (!providerToken) abort('Usta girişi yapılamadı.', providerLogin.json);

const pool = await call('GET', '/jobs/available?matchMyServices=true&limit=1', {
  token: providerToken,
});
const sample = pool.json?.data?.[0];
if (!sample) abort('Ustanın hizmet kapsamında açık iş yok; tohumlama gerekiyor.');

const cities = await call('GET', '/locations/cities');
const city = cities.json?.data?.find((item) => item.name === sample.address.cityName);
const districts = await call('GET', `/locations/districts?cityId=${city?.id}`);
const district = districts.json?.data?.find((item) => item.name === sample.address.districtName);
if (!city || !district) abort('Şehir/ilçe çözülemedi.');

const customer = await call('POST', '/auth/register', {
  body: {
    email: `chat+${Date.now()}@ustapilot.test`,
    password: 'Guclu1Parola',
    fullName: 'Sohbet Duman Testi',
    role: 'CUSTOMER',
  },
});
const token = customer.json?.data?.tokens?.accessToken;
if (!token) abort('Müşteri kaydı yapılamadı.', customer.json);

const createdJob = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: sample.category.id,
    title: 'Mesajlaşma akışı için açılan talep',
    description: 'Bu talep sohbet akışının uçtan uca doğrulanması için oluşturuldu.',
    size: 'SMALL',
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city.id, districtId: district.id, addressLine: 'Sohbet Sokak No: 3' },
    attachmentFileIds: [],
    publish: true,
  },
});
const job = createdJob.json?.data;
if (job?.status !== 'PUBLISHED') abort('Talep yayınlanamadı.', createdJob.json);

const offer = await call('POST', '/offers', {
  token: providerToken,
  body: { jobRequestId: job.id, amountMinor: 150000, priceType: 'FIXED', validityHours: 48 },
});
if (offer.status !== 201) abort('Teklif oluşturulamadı.', offer.json);

const accepted = await call('POST', `/offers/${offer.json.data.id}/accept`, { token, body: {} });
if (accepted.status !== 201) abort('Teklif kabul edilemedi.', accepted.json);

const orders = await call('GET', '/orders', { token });
const order = orders.json?.data?.find((item) => item.jobRequestId === job.id);
if (!order) abort('Sipariş bulunamadı.', orders.json);
check('sipariş hazır', Boolean(order.id));

console.log('\nSohbet açma:');
const opened = await call('POST', '/messages/conversations', { token, body: { orderId: order.id } });
check('sohbet 201 döner', opened.status === 201, `status=${opened.status}`);
const conversation = opened.json?.data;
check('iki katılımcı vardır', conversation?.participants?.length === 2, String(conversation?.participants?.length));
check('sipariş bağlanır', conversation?.orderId === order.id);
check('başlangıçta okunmamış yok', conversation?.unreadCount === 0);

const reopened = await call('POST', '/messages/conversations', {
  token: providerToken,
  body: { orderId: order.id },
});
check('ikinci açılışta aynı sohbet döner', reopened.json?.data?.id === conversation?.id);

const strangerRegister = await call('POST', '/auth/register', {
  body: {
    email: `chat-stranger+${Date.now()}@ustapilot.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı',
    role: 'CUSTOMER',
  },
});
const strangerToken = strangerRegister.json?.data?.tokens?.accessToken;

const strangerOpen = await call('POST', '/messages/conversations', {
  token: strangerToken,
  body: { orderId: order.id },
});
check(
  'ilgisiz kullanıcı sohbet açamaz',
  strangerOpen.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerOpen.status} code=${strangerOpen.json?.error?.code}`,
);

console.log('\nMesaj gönderme:');
const firstKey = messageKey('a');
const sent = await call('POST', `/messages/conversations/${conversation.id}/messages`, {
  token,
  body: { body: 'Merhaba, yarın sabah uygun musunuz?', clientMessageId: firstKey },
});
check('mesaj 201 döner', sent.status === 201, `status=${sent.status}`);
check('gövde korunur', sent.json?.data?.body === 'Merhaba, yarın sabah uygun musunuz?');
check('sıradan mesaj işaretlenmez', sent.json?.data?.isFlagged === false);

const repeat = await call('POST', `/messages/conversations/${conversation.id}/messages`, {
  token,
  body: { body: 'Merhaba, yarın sabah uygun musunuz?', clientMessageId: firstKey },
});
check('aynı anahtarla ikinci kayıt yazılmaz', repeat.json?.data?.id === sent.json?.data?.id);

const flagged = await call('POST', `/messages/conversations/${conversation.id}/messages`, {
  token: providerToken,
  body: { body: 'Beni 0532 123 45 67 numaradan arayın', clientMessageId: messageKey('b') },
});
check('telefon paylaşımı işaretlenir', flagged.json?.data?.isFlagged === true, JSON.stringify(flagged.json?.data?.isFlagged));

const empty = await call('POST', `/messages/conversations/${conversation.id}/messages`, {
  token,
  body: { clientMessageId: messageKey('c') },
});
check(
  'boş mesaj reddedilir',
  empty.json?.error?.code === 'VALIDATION_ERROR',
  `status=${empty.status} code=${empty.json?.error?.code}`,
);

const strangerSend = await call('POST', `/messages/conversations/${conversation.id}/messages`, {
  token: strangerToken,
  body: { body: 'İzinsiz mesaj', clientMessageId: messageKey('d') },
});
check(
  'katılımcı olmayan yazamaz',
  strangerSend.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `code=${strangerSend.json?.error?.code}`,
);

console.log('\nListeleme ve okundu:');
const thread = await call('GET', `/messages/conversations/${conversation.id}/messages`, { token });
check('mesajlar listelenir', thread.json?.data?.length === 2, String(thread.json?.data?.length));
check(
  'en yeni mesaj başta gelir',
  thread.json?.data?.[0]?.body === 'Beni 0532 123 45 67 numaradan arayın',
  thread.json?.data?.[0]?.body,
);

const customerView = await call('GET', `/messages/conversations/${conversation.id}`, { token });
check(
  'karşı tarafın mesajı okunmamış sayılır',
  customerView.json?.data?.unreadCount === 1,
  String(customerView.json?.data?.unreadCount),
);

const read = await call('POST', `/messages/conversations/${conversation.id}/read`, { token });
check('okundu işaretleme 201 döner', read.status === 201, `status=${read.status}`);
check('okundu sonrası sayaç sıfırlanır', read.json?.data?.unreadCount === 0, String(read.json?.data?.unreadCount));

const list = await call('GET', '/messages/conversations', { token });
check('sohbet listede görünür', list.json?.data?.some((item) => item.id === conversation.id));
check(
  'son mesaj özeti taşınır',
  list.json?.data?.[0]?.lastMessage?.body === 'Beni 0532 123 45 67 numaradan arayın',
  JSON.stringify(list.json?.data?.[0]?.lastMessage)?.slice(0, 160),
);

const strangerList = await call('GET', '/messages/conversations', { token: strangerToken });
check('ilgisiz kullanıcının listesi boş', strangerList.json?.data?.length === 0);

console.log('\nKapanan iş:');
const cancelled = await call('POST', `/orders/${order.id}/cancel`, {
  token,
  body: { reason: 'Sohbet testi' },
});
check('sipariş iptal edilir', cancelled.status === 201, `status=${cancelled.status}`);

const afterCancel = await call('POST', `/messages/conversations/${conversation.id}/messages`, {
  token,
  body: { body: 'İptalden sonra mesaj', clientMessageId: messageKey('e') },
});
check(
  'kapanan işte yeni mesaj yazılamaz',
  afterCancel.json?.error?.code === 'CONFLICT',
  `status=${afterCancel.status} code=${afterCancel.json?.error?.code}`,
);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
