/**
 * Ödeme akışının uçtan uca duman testi.
 *
 * Tahsilat, tekrar eden istemci anahtarı, sağlayıcı reddi, webhook imzası ve
 * iade yollarını yürütür. Çalışan bir API ve tohumlanmış veritabanı gerektirir;
 * her senaryo kendi müşterisini ve talebini açar.
 */
import { createHmac } from 'node:crypto';

const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234!';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? 'change_me_payment_webhook_secret';

/** Mock sağlayıcı kuruş hanesi 13 olan tutarları daima reddeder. */
const DECLINED_AMOUNT_MINOR = 200013;

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

/**
 * Webhook isteği. İmza ham gövde üzerinden hesaplandığı için gövde burada
 * elle serileştirilir; `JSON.stringify` iki kez çağrılırsa bayt farkı doğar.
 */
async function callWebhook(payload, { signature } = {}) {
  const rawBody = JSON.stringify(payload);
  const digest =
    signature ?? createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

  const response = await fetch(`${BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'IOS',
      'x-talpio-signature': digest,
    },
    body: rawBody,
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

function abort(message, payload) {
  console.error(`\n${message}`);
  if (payload) console.error(JSON.stringify(payload).slice(0, 400));
  process.exit(1);
}

/** Teklif kabul edilmiş, ödeme bekleyen yeni bir sipariş üretir. */
async function createOrderScenario(providerToken, sample, city, district, amountMinor) {
  const customer = await call('POST', '/auth/register', {
    body: {
      email: `payments+${Date.now()}${Math.random().toString(36).slice(2, 6)}@talpio.test`,
      password: 'Guclu1Parola',
      fullName: 'Ödeme Duman Testi',
      role: 'CUSTOMER',
    },
  });

  const token = customer.json?.data?.tokens?.accessToken;
  if (!token) abort('Müşteri kaydı yapılamadı.', customer.json);

  const created = await call('POST', '/jobs', {
    token,
    body: {
      categoryId: sample.category.id,
      title: 'Ödeme akışı için açılan talep',
      description: 'Bu talep ödeme akışının uçtan uca doğrulanması için oluşturuldu.',
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

  const offer = await call('POST', '/offers', {
    token: providerToken,
    body: {
      jobRequestId: job.id,
      amountMinor,
      priceType: 'FIXED',
      estimatedDurationMinutes: 120,
      materialsIncluded: true,
      validityHours: 48,
    },
  });

  if (offer.status !== 201) abort('Teklif oluşturulamadı.', offer.json);

  const accepted = await call('POST', `/offers/${offer.json.data.id}/accept`, {
    token,
    body: {},
  });

  if (accepted.status !== 201) abort('Teklif kabul edilemedi.', accepted.json);

  const orders = await call('GET', '/orders', { token });
  const order = orders.json?.data?.find((item) => item.jobRequestId === job.id);
  if (!order) abort('Kabul sonrası sipariş bulunamadı.', orders.json);

  return { token, job, order };
}

console.log(`Ödeme duman testi — ${BASE}\n`);

console.log('Hazırlık: satıcı girişi ve hizmet kapsamı');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: DEMO_PASSWORD },
});
check('demo satıcı girişi', providerLogin.status === 200, `status=${providerLogin.status}`);
const providerToken = providerLogin.json?.data?.tokens?.accessToken;
if (!providerToken) abort('Satıcı girişi yapılamadı; ödeme akışı doğrulanamıyor.');

const adminLogin = await call('POST', '/auth/login', {
  body: { email: 'admin@talpio.com', password: DEMO_PASSWORD },
});
check('demo yönetici girişi', adminLogin.status === 200, `status=${adminLogin.status}`);
const adminToken = adminLogin.json?.data?.tokens?.accessToken;
if (!adminToken) abort('Yönetici girişi yapılamadı.');

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

const walletBefore = await call('GET', '/payments/wallet', { token: providerToken });
check('satıcı cüzdan özetini görür', walletBefore.status === 200, `status=${walletBefore.status}`);
check(
  'bakiye kuruş cinsinden tam sayı',
  Number.isInteger(walletBefore.json?.data?.balance?.amountMinor),
  JSON.stringify(walletBefore.json?.data),
);
const pendingBefore = walletBefore.json?.data?.pending?.amountMinor ?? 0;

console.log('\nBaşarılı tahsilat:');
const main = await createOrderScenario(providerToken, sample, city, district, 180000);
const idempotencyKey = `smoke-payments-${main.order.id}`;

const paid = await call('POST', `/orders/${main.order.id}/pay`, {
  token: main.token,
  body: { idempotencyKey },
});
check('ödeme 201 döner', paid.status === 201, `status=${paid.status}`);
check('sipariş PAID olur', paid.json?.data?.status === 'PAID', paid.json?.data?.status);

const myPayments = await call('GET', `/payments?orderId=${main.order.id}`, { token: main.token });
const payment = myPayments.json?.data?.[0];
check('ödeme kaydı listelenir', Boolean(payment?.id), `status=${myPayments.status}`);
check('durum CAPTURED', payment?.status === 'CAPTURED', payment?.status);
check('tutar siparişle aynı', payment?.amount?.amountMinor === 180000, JSON.stringify(payment?.amount));
check('sağlayıcı adı taşınır', payment?.providerName === 'mock', payment?.providerName);
check(
  'sağlayıcı referansı üretilir',
  typeof payment?.providerReference === 'string' && payment.providerReference.startsWith('mock_'),
  payment?.providerReference,
);
check('tahsilat zamanı dolar', Boolean(payment?.capturedAt));

const walletAfterPay = await call('GET', '/payments/wallet', { token: providerToken });
check(
  'hakediş cüzdanda bloke edilir',
  walletAfterPay.json?.data?.pending?.amountMinor > pendingBefore,
  `${pendingBefore} → ${walletAfterPay.json?.data?.pending?.amountMinor}`,
);

const customerTransactions = await call('GET', `/payments/transactions?orderId=${main.order.id}`, {
  token: main.token,
});
check(
  'müşteri ödeme hareketini görür',
  customerTransactions.json?.data?.some(
    (item) => item.type === 'PAYMENT' && item.amount.amountMinor === 180000,
  ),
  JSON.stringify(customerTransactions.json?.data),
);

console.log('\nYetki:');
const providerView = await call('GET', `/payments/${payment.id}`, { token: providerToken });
check('ilgili satıcı ödemeyi görür', providerView.status === 200, `status=${providerView.status}`);

const staffView = await call('GET', `/payments/${payment.id}`, { token: adminToken });
check('personel ödemeyi görür', staffView.status === 200, `status=${staffView.status}`);

const stranger = await call('POST', '/auth/register', {
  body: {
    email: `payments-stranger+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı Müşteri',
    role: 'CUSTOMER',
  },
});
const strangerToken = stranger.json?.data?.tokens?.accessToken;

const strangerView = await call('GET', `/payments/${payment.id}`, { token: strangerToken });
check(
  'ilgisiz müşteri ödemeyi göremez',
  strangerView.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerView.status} code=${strangerView.json?.error?.code}`,
);

const strangerList = await call('GET', '/payments', { token: strangerToken });
check('ilgisiz müşterinin listesi boş', strangerList.json?.data?.length === 0);

console.log('\nTekrar eden istemci anahtarı:');
const repeat = await call('POST', `/orders/${main.order.id}/pay`, {
  token: main.token,
  body: { idempotencyKey },
});
check('aynı anahtar hata vermez', repeat.status === 201, `status=${repeat.status}`);

const afterRepeat = await call('GET', `/payments?orderId=${main.order.id}`, { token: main.token });
check(
  'ikinci istek çift tahsilat yazmaz',
  afterRepeat.json?.meta?.total === 1,
  `total=${afterRepeat.json?.meta?.total}`,
);

console.log('\nSağlayıcı reddi:');
const declined = await createOrderScenario(
  providerToken,
  sample,
  city,
  district,
  DECLINED_AMOUNT_MINOR,
);
const declinedPay = await call('POST', `/orders/${declined.order.id}/pay`, {
  token: declined.token,
  body: {},
});
check(
  'reddedilen ödeme PAYMENT_FAILED döner',
  declinedPay.json?.error?.code === 'PAYMENT_FAILED',
  `status=${declinedPay.status} code=${declinedPay.json?.error?.code}`,
);

const declinedOrder = await call('GET', `/orders/${declined.order.id}`, { token: declined.token });
check(
  'sipariş ödeme bekliyor durumunda kalır',
  declinedOrder.json?.data?.status === 'PENDING_PAYMENT',
  declinedOrder.json?.data?.status,
);

const declinedPayments = await call('GET', `/payments?orderId=${declined.order.id}`, {
  token: declined.token,
});
const failedPayment = declinedPayments.json?.data?.[0];
check('başarısız ödeme kaydı yazılır', failedPayment?.status === 'FAILED', failedPayment?.status);
check('ret gerekçesi saklanır', Boolean(failedPayment?.failureReason), failedPayment?.failureReason);

console.log('\nWebhook doğrulaması:');
const unsigned = await fetch(`${BASE}/payments/webhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'IOS' },
  body: JSON.stringify({ type: 'payment.captured', providerReference: payment.providerReference }),
});
check('imzasız istek reddedilir', unsigned.status === 401, `status=${unsigned.status}`);

const badSignature = await callWebhook(
  { type: 'payment.captured', providerReference: payment.providerReference },
  { signature: 'a'.repeat(64) },
);
check(
  'geçersiz imza reddedilir',
  badSignature.json?.error?.code === 'PAYMENT_WEBHOOK_INVALID',
  `status=${badSignature.status} code=${badSignature.json?.error?.code}`,
);

const unknownReference = await callWebhook({
  eventId: `evt-${Date.now()}`,
  type: 'payment.captured',
  providerReference: 'mock_bilinmeyen_referans',
});
check(
  'bilinmeyen referans sessizce yutulur',
  unknownReference.status === 201 && unknownReference.json?.data?.applied === false,
  `status=${unknownReference.status}`,
);

console.log('\nİptalde iade:');
const refundable = await createOrderScenario(providerToken, sample, city, district, 150000);
const refundablePaid = await call('POST', `/orders/${refundable.order.id}/pay`, {
  token: refundable.token,
  body: {},
});
check('iade senaryosu ödendi', refundablePaid.json?.data?.status === 'PAID');

const pendingBeforeCancel = (await call('GET', '/payments/wallet', { token: providerToken })).json
  ?.data?.pending?.amountMinor;

const cancelled = await call('POST', `/orders/${refundable.order.id}/cancel`, {
  token: refundable.token,
  body: { reason: 'Planım değişti' },
});
check('iptal 201 döner', cancelled.status === 201, `status=${cancelled.status}`);
check('sipariş CANCELLED olur', cancelled.json?.data?.status === 'CANCELLED');

const refundedPayments = await call('GET', `/payments?orderId=${refundable.order.id}`, {
  token: refundable.token,
});
const refundedPayment = refundedPayments.json?.data?.[0];
check('ödeme REFUNDED olur', refundedPayment?.status === 'REFUNDED', refundedPayment?.status);
check('iade zamanı dolar', Boolean(refundedPayment?.refundedAt));

const refundTransactions = await call(
  'GET',
  `/payments/transactions?orderId=${refundable.order.id}`,
  { token: refundable.token },
);
check(
  'iade ters kayıt olarak yazılır',
  refundTransactions.json?.data?.some(
    (item) => item.type === 'REFUND' && item.amount.amountMinor === -150000,
  ),
  JSON.stringify(refundTransactions.json?.data),
);

// Blokede tutulan tutar brüt değil, komisyon düşülmüş hakediştir.
const heldPayout = refundable.order.providerPayout.amountMinor;
const walletAfterRefund = await call('GET', '/payments/wallet', { token: providerToken });
check(
  'bloke hakediş geri alınır',
  walletAfterRefund.json?.data?.pending?.amountMinor === pendingBeforeCancel - heldPayout,
  `${pendingBeforeCancel} − ${heldPayout} ≠ ${walletAfterRefund.json?.data?.pending?.amountMinor}`,
);

console.log('\nPersonel iadesi:');
const staffCase = await createOrderScenario(providerToken, sample, city, district, 120000);
await call('POST', `/orders/${staffCase.order.id}/pay`, { token: staffCase.token, body: {} });

const staffPayments = await call('GET', `/payments?orderId=${staffCase.order.id}`, {
  token: staffCase.token,
});
const staffPaymentId = staffPayments.json?.data?.[0]?.id;

const customerRefund = await call('POST', `/payments/${staffPaymentId}/refund`, {
  token: staffCase.token,
  body: { reason: 'Vazgeçtim' },
});
check('müşteri iade başlatamaz', customerRefund.status === 403, `status=${customerRefund.status}`);

const staffRefund = await call('POST', `/payments/${staffPaymentId}/refund`, {
  token: adminToken,
  body: { reason: 'Destek kararıyla iade' },
});
check('personel iadesi 201 döner', staffRefund.status === 201, `status=${staffRefund.status}`);
check('ödeme REFUNDED olur', staffRefund.json?.data?.status === 'REFUNDED', staffRefund.json?.data?.status);

const doubleRefund = await call('POST', `/payments/${staffPaymentId}/refund`, {
  token: adminToken,
  body: {},
});
check(
  'iade edilmiş ödeme tekrar iade edilemez',
  doubleRefund.json?.error?.code === 'PAYMENT_NOT_REFUNDABLE',
  `code=${doubleRefund.json?.error?.code}`,
);

console.log('\nWebhook idempotency:');
const refundEvent = {
  eventId: `evt-${Date.now()}`,
  type: 'payment.refunded',
  providerReference: payment.providerReference,
  amountMinor: 180000,
};

const firstEvent = await callWebhook(refundEvent);
check('geçerli imzalı olay işlenir', firstEvent.json?.data?.applied === true, `status=${firstEvent.status}`);

const secondEvent = await callWebhook(refundEvent);
check('aynı olay ikinci kez işlenmez', secondEvent.json?.data?.applied === false);

const afterWebhook = await call('GET', `/payments/transactions?orderId=${main.order.id}`, {
  token: main.token,
});
check(
  'tekrar eden olay ikinci muhasebe kaydı yazmaz',
  afterWebhook.json?.data?.filter((item) => item.type === 'REFUND').length === 1,
  JSON.stringify(afterWebhook.json?.data?.map((item) => item.type)),
);

console.log('\nYönetim uçları:');
const adminPayments = await call('GET', '/admin/payments?limit=5', { token: adminToken });
check('yönetici ödeme listesi', adminPayments.status === 200, `status=${adminPayments.status}`);
check('liste sayfalama bilgisi taşır', Number.isInteger(adminPayments.json?.meta?.total));

const adminTransactions = await call('GET', '/admin/transactions?limit=5', { token: adminToken });
check('yönetici hareket listesi', adminTransactions.status === 200, `status=${adminTransactions.status}`);

const adminCommissions = await call('GET', '/admin/commissions?limit=5', { token: adminToken });
check('yönetici komisyon listesi', adminCommissions.status === 200, `status=${adminCommissions.status}`);

const customerAdminView = await call('GET', '/admin/payments', { token: main.token });
check('müşteri yönetim ucuna giremez', customerAdminView.status === 403, `status=${customerAdminView.status}`);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
