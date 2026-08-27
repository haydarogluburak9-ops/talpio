/**
 * Destek bileti ve şikâyet akışının uçtan uca duman testi.
 *
 * Bilet aç → kullanıcı mesajı → personel yanıtı → SUPPORT_REPLY bildirimi →
 * kapat; şikâyet aç → admin çözümle. Çalışan bir API ve tohumlanmış
 * (`SEED_DEMO_ACCOUNTS=true`) veritabanı gerektirir.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'yerel_demo_parolasi';

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

async function login(email, label) {
  const result = await call('POST', '/auth/login', {
    body: { email, password: DEMO_PASSWORD },
  });
  const token = result.json?.data?.tokens?.accessToken;
  if (!token) abort(`${label} oturumu açılamadı. Tohum verisi çalıştırıldı mı?`, result.json);
  return token;
}

console.log(`Destek duman testi — ${BASE}\n`);

console.log('Hazırlık: müşteri ve personel girişi');
const customer = await call('POST', '/auth/register', {
  body: {
    email: `support+${Date.now()}${Math.random().toString(36).slice(2, 6)}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Destek Duman Testi',
    role: 'CUSTOMER',
  },
});
const customerToken = customer.json?.data?.tokens?.accessToken;
const customerId = customer.json?.data?.user?.id;
if (!customerToken || !customerId) abort('Müşteri kaydı yapılamadı.', customer.json);
check('müşteri kaydı', Boolean(customerToken));

const staffToken = await login('destek@talpio.com', 'Destek personeli');
const adminToken = await login('admin@talpio.com', 'Admin');
check('personel girişi', Boolean(staffToken));
check('admin girişi', Boolean(adminToken));

console.log('\nDestek bileti:');
const created = await call('POST', '/support/tickets', {
  token: customerToken,
  body: {
    subject: 'Ödeme bloke kaldı',
    body: 'Sipariş ödemem onaylandı görünüyor ama satıcı tarafında bloke görünüyor.',
    attachmentFileIds: [],
  },
});
const ticket = created.json?.data;
check('bilet açıldı', created.status === 201 || created.status === 200, `status=${created.status}`);
check('ilk mesaj yazıldı', ticket?.messages?.length === 1, String(ticket?.messages?.length));
check('durum OPEN', ticket?.status === 'OPEN', ticket?.status);
if (!ticket?.id) abort('Bilet oluşturulamadı.', created.json);

const listed = await call('GET', '/support/tickets', { token: customerToken });
check(
  'kullanıcı kendi biletini görür',
  (listed.json?.data ?? []).some((item) => item.id === ticket.id),
);

const userReply = await call('POST', `/support/tickets/${ticket.id}/messages`, {
  token: customerToken,
  body: { body: 'Ek bilgi: işlem numarası test-123.', attachmentFileIds: [] },
});
check('kullanıcı mesaj ekler', userReply.status === 201 || userReply.status === 200);
const afterUser = await call('GET', `/support/tickets/${ticket.id}`, { token: customerToken });
check(
  'kullanıcı yazınca WAITING_SUPPORT',
  afterUser.json?.data?.status === 'WAITING_SUPPORT',
  afterUser.json?.data?.status,
);

const staffReply = await call('POST', `/admin/support-tickets/${ticket.id}/messages`, {
  token: staffToken,
  body: { body: 'İnceliyoruz; 24 saat içinde dönüş yapacağız.', attachmentFileIds: [] },
});
check('personel yanıt yazar', staffReply.status === 201 || staffReply.status === 200);

const afterStaff = await call('GET', `/support/tickets/${ticket.id}`, { token: customerToken });
check(
  'personel yazınca WAITING_CUSTOMER',
  afterStaff.json?.data?.status === 'WAITING_CUSTOMER',
  afterStaff.json?.data?.status,
);

const notifications = await call('GET', '/notifications?limit=20', { token: customerToken });
const types = (notifications.json?.data ?? []).map((item) => item.type);
check('SUPPORT_REPLY bildirimi düşer', types.includes('SUPPORT_REPLY'), types.join(','));

const assigned = await call('PATCH', `/admin/support-tickets/${ticket.id}`, {
  token: staffToken,
  body: { status: 'RESOLVED' },
});
check('personel durumu RESOLVED yapar', assigned.json?.data?.status === 'RESOLVED');

const closed = await call('POST', `/support/tickets/${ticket.id}/close`, {
  token: customerToken,
});
check('kullanıcı bileti kapatır', closed.json?.data?.status === 'CLOSED', closed.json?.data?.status);

const stranger = await call('POST', '/auth/register', {
  body: {
    email: `support-stranger+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı Kullanıcı',
    role: 'CUSTOMER',
  },
});
const strangerToken = stranger.json?.data?.tokens?.accessToken;
const forbidden = await call('GET', `/support/tickets/${ticket.id}`, { token: strangerToken });
check('yabancı bilet göremez', forbidden.status === 403 || forbidden.status === 404, `status=${forbidden.status}`);

const adminList = await call('GET', '/admin/support-tickets?status=CLOSED', { token: adminToken });
check(
  'admin kapatılmış bileti listeler',
  (adminList.json?.data ?? []).some((item) => item.id === ticket.id),
);

console.log('\nŞikâyet:');
const complaintCreated = await call('POST', '/support/complaints', {
  token: customerToken,
  body: {
    subjectType: 'USER',
    subjectId: customerId,
    reason: 'Uygunsuz davranış',
    description: 'Test amaçlı şikâyet kaydı.',
  },
});
const complaint = complaintCreated.json?.data;
check(
  'şikâyet oluşturuldu',
  complaintCreated.status === 201 || complaintCreated.status === 200,
  `status=${complaintCreated.status}`,
);
check('şikâyet OPEN', complaint?.status === 'OPEN', complaint?.status);
if (!complaint?.id) abort('Şikâyet oluşturulamadı.', complaintCreated.json);

const myComplaints = await call('GET', '/support/complaints', { token: customerToken });
check(
  'kullanıcı kendi şikâyetini görür',
  (myComplaints.json?.data ?? []).some((item) => item.id === complaint.id),
);

const resolved = await call('PATCH', `/admin/complaints/${complaint.id}`, {
  token: adminToken,
  body: { status: 'RESOLVED', resolutionNote: 'İncelendi, uyarı verildi.' },
});
check('admin şikâyeti çözümler', resolved.json?.data?.status === 'RESOLVED', resolved.json?.data?.status);
check(
  'çözüm notu yazılır',
  resolved.json?.data?.resolutionNote === 'İncelendi, uyarı verildi.',
);
check('resolvedAt dolu', Boolean(resolved.json?.data?.resolvedAt));

const adminComplaints = await call('GET', '/admin/complaints?status=RESOLVED', {
  token: adminToken,
});
check(
  'admin çözülmüş şikâyeti listeler',
  (adminComplaints.json?.data ?? []).some((item) => item.id === complaint.id),
);

console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı`);
process.exit(failed > 0 ? 1 : 0);
