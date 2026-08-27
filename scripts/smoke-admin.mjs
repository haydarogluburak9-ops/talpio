/**
 * Yönetim panelinin uçtan uca duman testi.
 *
 * Özet sayımları, kullanıcı ve satıcı yönetimini, liste uçlarını, denetim
 * kaydını ve rol kısıtlarını doğrular. Çalışan bir API ile tohumlanmış
 * (`SEED_DEMO_ACCOUNTS=true`) veritabanı gerektirir.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
// Bu betik yalnızca yetkili hesaplarla giriş yapar; onlar ayrı parola kullanır.
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

  return { status: response.status, json: await response.json().catch(() => null) };
}

function abort(message, payload) {
  console.error(`\n${message}`);
  if (payload) console.error(JSON.stringify(payload).slice(0, 400));
  process.exit(1);
}

async function login(email, label) {
  const result = await call('POST', '/auth/login', {
    body: { email, password: ADMIN_PASSWORD },
  });

  const token = result.json?.data?.tokens?.accessToken;
  if (!token) abort(`${label} oturumu açılamadı. Tohum verisi çalıştırıldı mı?`, result.json);

  return token;
}

async function register(role, label) {
  const result = await call('POST', '/auth/register', {
    body: {
      email: `admin-smoke-${label}+${Date.now()}@talpio.test`,
      password: 'Guclu1Parola',
      fullName: 'Yönetim Duman Testi',
      role,
    },
  });

  const payload = result.json?.data;
  if (!payload?.tokens?.accessToken) abort(`${label} kaydı yapılamadı.`, result.json);

  return { token: payload.tokens.accessToken, userId: payload.user.id };
}

console.log(`Yönetim duman testi — ${BASE}\n`);

const adminToken = await login('admin@talpio.com', 'Süper admin');
const supportToken = await login('destek@talpio.com', 'Destek');
const target = await register('CUSTOMER', 'target');
const targetProvider = await register('PROVIDER', 'provider');

const adminSelf = await call('GET', '/auth/me', { token: adminToken });
const adminUserId = adminSelf.json?.data?.id;
if (!adminUserId) abort('Yönetici kimliği okunamadı.', adminSelf.json);

console.log('Özet:');
const dashboard = await call('GET', '/admin/dashboard', { token: adminToken });
check('özet okunur', dashboard.status === 200, `status=${dashboard.status}`);
check('kullanıcı sayımı pozitif', (dashboard.json?.data?.users?.total ?? 0) > 0);
check('müşteri ve satıcı ayrı sayılır', dashboard.json?.data?.users?.customers !== undefined);
check(
  'komisyon para birimiyle döner',
  typeof dashboard.json?.data?.orders?.commissionEarned?.currency === 'string',
);

console.log('\nKullanıcı listesi:');
const users = await call('GET', '/admin/users?limit=5', { token: adminToken });
check('liste okunur', users.status === 200, `status=${users.status}`);
check('sayfa boyutu uygulanır', (users.json?.data?.length ?? 0) <= 5);
check('sayfalama üst verisi döner', users.json?.meta?.total > 0);

const searched = await call(`GET`, `/admin/users?q=admin@talpio.com`, { token: adminToken });
check('e-posta ile aranır', searched.json?.data?.[0]?.email === 'admin@talpio.com');

const filtered = await call('GET', '/admin/users?role=PROVIDER', { token: adminToken });
check(
  'rol filtresi yalnızca satıcıları döner',
  (filtered.json?.data ?? []).every((user) => user.role === 'PROVIDER'),
);

const multiRole = await call('GET', '/admin/users?role=CUSTOMER,PROVIDER', { token: adminToken });
check('virgüllü rol listesi kabul edilir', multiRole.status === 200, `status=${multiRole.status}`);

const badRole = await call('GET', '/admin/users?role=HACKER', { token: adminToken });
check('bilinmeyen rol reddedilir', badRole.status === 422, `status=${badRole.status}`);

const detail = await call('GET', `/admin/users/${target.userId}`, { token: adminToken });
check('kullanıcı ayrıntısı okunur', detail.json?.data?.id === target.userId, `status=${detail.status}`);

console.log('\nHesap durumu:');
const suspended = await call('PATCH', `/admin/users/${target.userId}/status`, {
  token: adminToken,
  body: { status: 'SUSPENDED', reason: 'Duman testi' },
});
check('askıya alınır', suspended.json?.data?.status === 'SUSPENDED', `status=${suspended.status}`);

const reactivated = await call('PATCH', `/admin/users/${target.userId}/status`, {
  token: adminToken,
  body: { status: 'ACTIVE' },
});
check('yeniden etkinleştirilir', reactivated.json?.data?.status === 'ACTIVE');

const invalidStatus = await call('PATCH', `/admin/users/${target.userId}/status`, {
  token: adminToken,
  body: { status: 'PENDING_VERIFICATION' },
});
check('kayıt akışına ait durum yazılamaz', invalidStatus.status === 422, `status=${invalidStatus.status}`);

const selfLock = await call('PATCH', `/admin/users/${adminUserId}/status`, {
  token: adminToken,
  body: { status: 'SUSPENDED' },
});
check('kendi hesabı kilitlenemez', selfLock.status === 403, `status=${selfLock.status}`);

const missingUser = await call('PATCH', '/admin/users/0194a1b2-c3d4-7000-8000-0000deadbeef/status', {
  token: adminToken,
  body: { status: 'SUSPENDED' },
});
check('bulunmayan kullanıcı 404 döner', missingUser.status === 404, `status=${missingUser.status}`);

// Askıya alma oturumları da kapatır; aksi halde elindeki jeton bitene kadar
// askıdaki hesap çalışmaya devam ederdi.
const afterSuspend = await call('GET', '/users/me', { token: target.token });
check('askıya alma oturumu kapatır', afterSuspend.status === 401, `status=${afterSuspend.status}`);

console.log('\nOturum kapatma:');
const sessionTarget = await register('CUSTOMER', 'sessions');

const revoked = await call('POST', `/admin/users/${sessionTarget.userId}/revoke-sessions`, {
  token: adminToken,
});
check('oturumlar kapatılır', revoked.json?.data?.revokedCount >= 1, `status=${revoked.status}`);

const afterRevoke = await call('GET', '/users/me', { token: sessionTarget.token });
check('kapatılan oturum jetonu geçersizdir', afterRevoke.status === 401, `status=${afterRevoke.status}`);

const revokedAgain = await call('POST', `/admin/users/${sessionTarget.userId}/revoke-sessions`, {
  token: adminToken,
});
check('açık oturum yokken sıfır döner', revokedAgain.json?.data?.revokedCount === 0);

console.log('\nSatıcı doğrulama:');
const providers = await call('GET', '/admin/providers', { token: adminToken });
check('satıcı listesi okunur', providers.status === 200, `status=${providers.status}`);

const providerProfile = await call('GET', '/providers/me', { token: targetProvider.token });
const providerProfileId = providerProfile.json?.data?.id;
if (!providerProfileId) abort('Satıcı profili okunamadı.', providerProfile.json);

const verified = await call('PATCH', `/admin/providers/${providerProfileId}/verification`, {
  token: adminToken,
  body: { verificationStatus: 'VERIFIED' },
});
check('doğrulanır', verified.json?.data?.verificationStatus === 'VERIFIED', `status=${verified.status}`);

const rejected = await call('PATCH', `/admin/providers/${providerProfileId}/verification`, {
  token: adminToken,
  body: { verificationStatus: 'REJECTED', reason: 'Belge okunamadı' },
});
check('reddedilir', rejected.json?.data?.verificationStatus === 'REJECTED');

const pendingDecision = await call('PATCH', `/admin/providers/${providerProfileId}/verification`, {
  token: adminToken,
  body: { verificationStatus: 'PENDING' },
});
check('sonuçlanmamış karar yazılamaz', pendingDecision.status === 422, `status=${pendingDecision.status}`);

const pendingFilter = await call('GET', '/admin/providers?verificationStatus=PENDING', {
  token: adminToken,
});
check(
  'doğrulama filtresi çalışır',
  (pendingFilter.json?.data ?? []).every((row) => row.verificationStatus === 'PENDING'),
);

console.log('\nİş, teklif ve sipariş listeleri:');
const jobs = await call('GET', '/admin/jobs?limit=3', { token: adminToken });
check('talep listesi okunur', jobs.status === 200, `status=${jobs.status}`);

const jobStatusFilter = await call('GET', '/admin/jobs?status=PUBLISHED,OFFERS_RECEIVED', {
  token: adminToken,
});
check(
  'talep durum filtresi çalışır',
  (jobStatusFilter.json?.data ?? []).every((job) =>
    ['PUBLISHED', 'OFFERS_RECEIVED'].includes(job.status),
  ),
);

const offers = await call('GET', '/admin/offers?limit=3', { token: adminToken });
check('teklif listesi okunur', offers.status === 200, `status=${offers.status}`);
check(
  'teklif tutarı para nesnesi olarak döner',
  offers.json?.data?.length === 0 ||
    typeof offers.json?.data?.[0]?.price?.amountMinor === 'number',
);

const orders = await call('GET', '/admin/orders?limit=3', { token: adminToken });
check('sipariş listesi okunur', orders.status === 200, `status=${orders.status}`);
check(
  'siparişte komisyon görünür',
  orders.json?.data?.length === 0 ||
    typeof orders.json?.data?.[0]?.commission?.amountMinor === 'number',
);

const badSort = await call('GET', '/admin/orders?sort=totalMinor', { token: adminToken });
check('biçimsiz sıralama reddedilir', badSort.status === 422, `status=${badSort.status}`);

console.log('\nDenetim kaydı:');
const logs = await call('GET', '/admin/audit-logs', { token: adminToken });
check('kayıtlar okunur', logs.status === 200, `status=${logs.status}`);
check('durum değişikliği kaydedilmiş', 
  (logs.json?.data ?? []).some((log) => log.action === 'user.status.updated'),
);
check('doğrulama kararı kaydedilmiş',
  (logs.json?.data ?? []).some((log) => log.action === 'provider.verification.updated'),
);
check('kaydı yapan görünür', (logs.json?.data ?? [])[0]?.actorName != null);

const logsByEntity = await call('GET', '/admin/audit-logs?entityType=ProviderProfile', {
  token: adminToken,
});
check(
  'kayıt türü filtresi çalışır',
  (logsByEntity.json?.data ?? []).every((log) => log.entityType === 'ProviderProfile'),
);

console.log('\nYetki kısıtları:');
const customerDashboard = await call('GET', '/admin/dashboard', { token: targetProvider.token });
check('satıcı panele erişemez', customerDashboard.status === 403, `status=${customerDashboard.status}`);

const anonymous = await call('GET', '/admin/users');
check('oturumsuz istek reddedilir', anonymous.status === 401, `status=${anonymous.status}`);

const supportRead = await call('GET', '/admin/users?limit=1', { token: supportToken });
check('destek listeyi okuyabilir', supportRead.status === 200, `status=${supportRead.status}`);

const supportWrite = await call('PATCH', `/admin/users/${target.userId}/status`, {
  token: supportToken,
  body: { status: 'SUSPENDED' },
});
check('destek durum değiştiremez', supportWrite.status === 403, `status=${supportWrite.status}`);

const supportAudit = await call('GET', '/admin/audit-logs', { token: supportToken });
check('destek denetim kaydı göremez', supportAudit.status === 403, `status=${supportAudit.status}`);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
