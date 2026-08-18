/**
 * Dosya yükleme akışının uçtan uca duman testi.
 *
 * Tür ve boyut sınırlarını, sahiplik kurallarını, gizli belge erişimini ve
 * yüklenen fotoğrafın talebe bağlanmasını doğrular. Çalışan bir API, MinIO ve
 * tohumlanmış veritabanı gerektirir.
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

function abort(message, payload) {
  console.error(`\n${message}`);
  if (payload) console.error(JSON.stringify(payload).slice(0, 400));
  process.exit(1);
}

/** Küçük ama geçerli bir JPEG başlığı; sunucu içeriği çözmez, türü başlıktan okur. */
const TINY_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

console.log(`Dosya duman testi — ${BASE}\n`);

const registered = await call('POST', '/auth/register', {
  body: {
    email: `files+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Dosya Duman Testi',
    role: 'CUSTOMER',
  },
});
const token = registered.json?.data?.tokens?.accessToken;
if (!token) abort('Müşteri kaydı yapılamadı.', registered.json);

const otherRegistered = await call('POST', '/auth/register', {
  body: {
    email: `files-other+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Başka Kullanıcı',
    role: 'CUSTOMER',
  },
});
const otherToken = otherRegistered.json?.data?.tokens?.accessToken;

console.log('Yükleme:');
const photo = await upload(token, {
  bytes: TINY_JPEG,
  mimeType: 'image/jpeg',
  filename: 'mutfak.jpg',
  purpose: 'JOB_PHOTO',
});
check('fotoğraf 201 döner', photo.status === 201, `status=${photo.status}`);
check('erişim adresi üretilir', typeof photo.json?.data?.url === 'string', photo.json?.data?.url);
check('herkese açık işaretlenir', photo.json?.data?.isPublic === true);
check('özgün ad korunur', photo.json?.data?.originalName === 'mutfak.jpg');

const executable = await upload(token, {
  bytes: TINY_JPEG,
  mimeType: 'application/x-msdownload',
  filename: 'kotu.exe',
  purpose: 'JOB_PHOTO',
});
check(
  'çalıştırılabilir dosya reddedilir',
  executable.json?.error?.code === 'UNSUPPORTED_FILE_TYPE',
  `status=${executable.status} code=${executable.json?.error?.code}`,
);

const pdfAsPhoto = await upload(token, {
  bytes: TINY_JPEG,
  mimeType: 'application/pdf',
  filename: 'belge.pdf',
  purpose: 'JOB_PHOTO',
});
check(
  'fotoğraf amacında PDF reddedilir',
  pdfAsPhoto.json?.error?.code === 'UNSUPPORTED_FILE_TYPE',
  `code=${pdfAsPhoto.json?.error?.code}`,
);

const document = await upload(token, {
  bytes: TINY_JPEG,
  mimeType: 'application/pdf',
  filename: 'ustalik.pdf',
  purpose: 'PROVIDER_DOCUMENT',
});
check('belge yüklenir', document.status === 201, `status=${document.status}`);
check('belge gizli tutulur', document.json?.data?.isPublic === false);

const oversized = await upload(token, {
  bytes: new Uint8Array(11 * 1024 * 1024),
  mimeType: 'image/jpeg',
  filename: 'buyuk.jpg',
  purpose: 'JOB_PHOTO',
});
check(
  'boyut sınırı uygulanır',
  oversized.status === 413 || oversized.json?.error?.code === 'FILE_TOO_LARGE',
  `status=${oversized.status} code=${oversized.json?.error?.code}`,
);

console.log('\nErişim:');
const publicRead = await call('GET', `/files/${photo.json.data.id}`, { token: otherToken });
check('herkese açık dosyayı yabancı da okur', publicRead.status === 200, `status=${publicRead.status}`);

const privateRead = await call('GET', `/files/${document.json.data.id}`, { token: otherToken });
check(
  'gizli belgeyi yabancı okuyamaz',
  privateRead.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${privateRead.status} code=${privateRead.json?.error?.code}`,
);

const ownerRead = await call('GET', `/files/${document.json.data.id}`, { token });
check('gizli belgeyi sahibi okur', ownerRead.status === 200, `status=${ownerRead.status}`);
check(
  'gizli belge imzalı adresle döner',
  typeof ownerRead.json?.data?.url === 'string' && ownerRead.json.data.url.includes('X-Amz-'),
  ownerRead.json?.data?.url?.slice(0, 80),
);

console.log('\nTalebe bağlama:');
const cities = await call('GET', '/locations/cities');
const city = cities.json?.data?.[0];
const districts = await call('GET', `/locations/districts?cityId=${city?.id}`);
const district = districts.json?.data?.[0];
const categories = await call('GET', '/categories');
const category = categories.json?.data?.[0];
if (!city || !district || !category) abort('Katalog verisi eksik.');

const createdJob = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: category.id,
    title: 'Dosya ekli talep',
    description: 'Yüklenen fotoğrafın talebe bağlandığını doğrulamak için oluşturuldu.',
    size: 'SMALL',
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city.id, districtId: district.id, addressLine: 'Dosya Sokak No: 1' },
    attachmentFileIds: [photo.json.data.id],
    publish: true,
  },
});
check('fotoğraflı talep oluşur', createdJob.status === 201, `status=${createdJob.status}`);
check(
  'fotoğraf talebe iliştirilir',
  createdJob.json?.data?.attachments?.length === 1,
  JSON.stringify(createdJob.json?.data?.attachments)?.slice(0, 200),
);

const stolen = await call('POST', '/jobs', {
  token: otherToken,
  body: {
    categoryId: category.id,
    title: 'Yabancı dosyayla talep',
    description: 'Başkasının yüklediği dosyanın iliştirilemediğini doğrulamak için oluşturuldu.',
    size: 'SMALL',
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city.id, districtId: district.id, addressLine: 'Dosya Sokak No: 2' },
    attachmentFileIds: [photo.json.data.id],
    publish: true,
  },
});
check(
  'yabancı dosya talebe iliştirilemez',
  stolen.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${stolen.status} code=${stolen.json?.error?.code}`,
);

console.log('\nSilme:');
const spare = await upload(token, {
  bytes: TINY_JPEG,
  mimeType: 'image/jpeg',
  filename: 'bosta.jpg',
  purpose: 'JOB_PHOTO',
});

const strangerDelete = await call('DELETE', `/files/${spare.json.data.id}`, { token: otherToken });
check(
  'yabancı dosyayı silemez',
  strangerDelete.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerDelete.status} code=${strangerDelete.json?.error?.code}`,
);

const ownerDelete = await call('DELETE', `/files/${spare.json.data.id}`, { token });
check('bağlanmamış dosya silinir', ownerDelete.status === 204, `status=${ownerDelete.status}`);

const attachedDelete = await call('DELETE', `/files/${photo.json.data.id}`, { token });
check(
  'talebe bağlı dosya silinemez',
  attachedDelete.json?.error?.code === 'CONFLICT',
  `status=${attachedDelete.status} code=${attachedDelete.json?.error?.code}`,
);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed === 0 ? 0 : 1);
