/**
 * Profil akışının uçtan uca duman testi.
 *
 * Kullanıcı profili güncelleme, profil görseli, usta profili ile hizmet ve
 * bölge yönetimini doğrular. Çalışan bir API, MinIO ve tohumlanmış veritabanı
 * gerektirir.
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

  return { status: response.status, json: await response.json().catch(() => null) };
}

async function upload(token, { bytes, mimeType, filename, purpose }) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), filename);
  form.append('purpose', purpose);

  const response = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'X-Client-Platform': 'IOS' },
    body: form,
  });

  return { status: response.status, json: await response.json().catch(() => null) };
}

async function register(role, label) {
  const result = await call('POST', '/auth/register', {
    body: {
      email: `profile-${label}+${Date.now()}@ustapilot.test`,
      password: 'Guclu1Parola',
      fullName: 'Profil Duman Testi',
      role,
    },
  });

  const token = result.json?.data?.tokens?.accessToken;
  if (!token) abort(`${label} kaydı yapılamadı.`, result.json);

  return token;
}

function abort(message, payload) {
  console.error(`\n${message}`);
  if (payload) console.error(JSON.stringify(payload).slice(0, 400));
  process.exit(1);
}

/** Küçük ama geçerli bir JPEG başlığı; sunucu içeriği çözmez, türü başlıktan okur. */
const TINY_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

console.log(`Profil duman testi — ${BASE}\n`);

const customerToken = await register('CUSTOMER', 'customer');
const providerToken = await register('PROVIDER', 'provider');

console.log('Kullanıcı profili:');
const me = await call('GET', '/users/me', { token: customerToken });
check('kendi profilini okur', me.status === 200, `status=${me.status}`);
check('rol müşteri', me.json?.data?.role === 'CUSTOMER');

const renamed = await call('PATCH', '/users/me', {
  token: customerToken,
  body: { fullName: 'Ayşe Yılmaz' },
});
check('ad güncellenir', renamed.json?.data?.fullName === 'Ayşe Yılmaz', `status=${renamed.status}`);

const shortName = await call('PATCH', '/users/me', {
  token: customerToken,
  body: { fullName: 'A' },
});
check('çok kısa ad reddedilir', shortName.status === 422, `status=${shortName.status}`);

const badPhone = await call('PATCH', '/users/me', {
  token: customerToken,
  body: { phone: '0532 123 45 67' },
});
check('E.164 dışı telefon reddedilir', badPhone.status === 422, `status=${badPhone.status}`);

const phone = `+90532${String(Date.now()).slice(-7)}`;
const withPhone = await call('PATCH', '/users/me', { token: customerToken, body: { phone } });
check('telefon eklenir', withPhone.json?.data?.phone === phone, `status=${withPhone.status}`);
check('telefon doğrulaması sıfırlanır', withPhone.json?.data?.phoneVerifiedAt === null);

const takenPhone = await call('PATCH', '/users/me', { token: providerToken, body: { phone } });
check('başkasının telefonu alınamaz', takenPhone.status === 409, `status=${takenPhone.status}`);

const anonymous = await call('GET', '/users/me');
check('oturumsuz erişim reddedilir', anonymous.status === 401, `status=${anonymous.status}`);

console.log('\nProfil görseli:');
const avatar = await upload(customerToken, {
  bytes: TINY_JPEG,
  mimeType: 'image/jpeg',
  filename: 'profil.jpg',
  purpose: 'AVATAR',
});
const avatarFileId = avatar.json?.data?.id;
check('görsel yüklenir', avatar.status === 201, `status=${avatar.status}`);

const withAvatar = await call('PATCH', '/users/me', {
  token: customerToken,
  body: { avatarFileId },
});
check('görsel profile bağlanır', Boolean(withAvatar.json?.data?.avatarUrl), `status=${withAvatar.status}`);

const stolenAvatar = await call('PATCH', '/users/me', {
  token: providerToken,
  body: { avatarFileId },
});
check('başkasının görseli kullanılamaz', stolenAvatar.status === 403, `status=${stolenAvatar.status}`);

const removedAvatar = await call('PATCH', '/users/me', {
  token: customerToken,
  body: { avatarFileId: null },
});
check('görsel kaldırılır', removedAvatar.json?.data?.avatarUrl === null, `status=${removedAvatar.status}`);

console.log('\nUsta profili:');
const providerMe = await call('GET', '/providers/me', { token: providerToken });
const providerProfileId = providerMe.json?.data?.id;
check('usta kendi profilini okur', providerMe.status === 200, `status=${providerMe.status}`);
check('yeni usta doğrulanmamış', providerMe.json?.data?.isVerified === false);

const customerOnProvider = await call('GET', '/providers/me', { token: customerToken });
check('müşteri usta profiline erişemez', customerOnProvider.status === 403, `status=${customerOnProvider.status}`);

const updatedProvider = await call('PATCH', '/providers/me', {
  token: providerToken,
  body: { businessName: 'Yılmaz Tesisat', experienceYears: 8, canIssueInvoice: true },
});
check('işletme bilgisi güncellenir', updatedProvider.json?.data?.businessName === 'Yılmaz Tesisat', `status=${updatedProvider.status}`);
check('deneyim yılı yazılır', updatedProvider.json?.data?.experienceYears === 8);
check('doğrulama durumu değişmez', updatedProvider.json?.data?.isVerified === false);

const tooLongExperience = await call('PATCH', '/providers/me', {
  token: providerToken,
  body: { experienceYears: 120 },
});
check('mantıksız deneyim reddedilir', tooLongExperience.status === 422, `status=${tooLongExperience.status}`);

console.log('\nHizmetler:');
const categories = await call('GET', '/categories', { token: providerToken });
const categoryList = categories.json?.data?.items ?? categories.json?.data;
if (!Array.isArray(categoryList) || categoryList.length < 2) {
  abort('Katalog verisi eksik.', categories.json);
}
const [first, second] = categoryList;

const services = await call('PUT', '/providers/me/services', {
  token: providerToken,
  body: {
    services: [
      { categoryId: first.id, startingPriceMinor: 50_000 },
      { categoryId: second.id },
    ],
  },
});
check('hizmetler yazılır', services.json?.data?.length === 2, `status=${services.status}`);

const listed = await call('GET', '/providers/me/services', { token: providerToken });
check('hizmetler listelenir', listed.json?.data?.length === 2, `status=${listed.status}`);

const reduced = await call('PUT', '/providers/me/services', {
  token: providerToken,
  body: { services: [{ categoryId: first.id, startingPriceMinor: 75_000 }] },
});
check('listede olmayan hizmet silinir', reduced.json?.data?.length === 1, `status=${reduced.status}`);
check('fiyat güncellenir', reduced.json?.data?.[0]?.startingPriceMinor === 75_000);

const emptyServices = await call('PUT', '/providers/me/services', {
  token: providerToken,
  body: { services: [] },
});
check('boş hizmet listesi reddedilir', emptyServices.status === 422, `status=${emptyServices.status}`);

const unknownCategory = await call('PUT', '/providers/me/services', {
  token: providerToken,
  body: { services: [{ categoryId: '0194a1b2-c3d4-7000-8000-0000deadbeef' }] },
});
check('bilinmeyen kategori reddedilir', unknownCategory.status === 404, `status=${unknownCategory.status}`);

const customerService = await call('PUT', '/providers/me/services', {
  token: customerToken,
  body: { services: [{ categoryId: first.id }] },
});
check('müşteri hizmet tanımlayamaz', customerService.status === 403, `status=${customerService.status}`);

console.log('\nHizmet bölgeleri:');
const cities = await call('GET', '/locations/cities', { token: providerToken });
const cityList = cities.json?.data?.items ?? cities.json?.data;
const cityId = cityList?.[0]?.id;
if (!cityId) abort('Şehir verisi eksik.', cities.json);

const districts = await call('GET', `/locations/districts?cityId=${cityId}`, {
  token: providerToken,
});
const districtList = districts.json?.data?.items ?? districts.json?.data;
if (!Array.isArray(districtList) || districtList.length < 2) {
  abort('İlçe verisi eksik.', districts.json);
}

const areas = await call('PUT', '/providers/me/service-areas', {
  token: providerToken,
  body: { districtIds: [districtList[0].id, districtList[1].id] },
});
check('bölgeler yazılır', areas.json?.data?.serviceAreas?.length === 2, `status=${areas.status}`);

const singleArea = await call('PUT', '/providers/me/service-areas', {
  token: providerToken,
  body: { districtIds: [districtList[0].id] },
});
check('listede olmayan bölge silinir', singleArea.json?.data?.serviceAreas?.length === 1, `status=${singleArea.status}`);

const unknownDistrict = await call('PUT', '/providers/me/service-areas', {
  token: providerToken,
  body: { districtIds: ['0194a1b2-c3d4-7000-8000-0000deadbeef'] },
});
check('bilinmeyen ilçe reddedilir', unknownDistrict.status === 404, `status=${unknownDistrict.status}`);

console.log('\nHerkese açık kart:');
const publicCard = await call('GET', `/providers/${providerProfileId}`, { token: customerToken });
check('müşteri usta kartını görür', publicCard.status === 200, `status=${publicCard.status}`);
check('kartta işletme adı görünür', publicCard.json?.data?.displayName === 'Yılmaz Tesisat');
check('kartta hakkında metni yok', publicCard.json?.data?.about === undefined);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
