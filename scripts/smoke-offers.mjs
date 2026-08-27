/**
 * Teklif akışının uçtan uca duman testi.
 *
 * Çalışan bir API ve tohumlanmış veritabanı gerektirir. Her çalıştırmada yeni
 * bir müşteri hesabı açar ve demo satıcıyla teklif verir; mevcut demo verisini
 * kirletmemek için kendi oluşturduğu talep üzerinde çalışır.
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

console.log(`Teklif duman testi — ${BASE}\n`);

console.log('Hazırlık: satıcı girişi ve hizmet kapsamı');
const providerLogin = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: DEMO_PASSWORD },
});
check('demo satıcı girişi', providerLogin.status === 200, `status=${providerLogin.status}`);
const providerToken = providerLogin.json?.data?.tokens?.accessToken;

if (!providerToken) {
  console.log('\nSatıcı girişi yapılamadı; teklif akışı doğrulanamıyor.');
  process.exit(1);
}

/**
 * Teklif verilebilmesi için talebin satıcının hizmet kategorisi ve bölgesinde
 * olması gerekir. Havuzdan bir iş çekip aynı kategori/ilçeyi kullanırız.
 */
const pool = await call('GET', '/jobs/available?matchMyServices=true&limit=1', {
  token: providerToken,
});
check('havuz 200 döner', pool.status === 200, JSON.stringify(pool.json)?.slice(0, 300));
const sample = pool.json?.data?.[0];
check('satıcının kapsamında örnek iş var', Boolean(sample?.id), 'havuz boş');

if (!sample) {
  console.log('\nSatıcının hizmet kapsamında açık iş yok; tohumlama gerekiyor.');
  process.exit(1);
}

const cities = await call('GET', '/locations/cities');
const city = cities.json?.data?.find((item) => item.name === sample.address.cityName);
const districts = await call('GET', `/locations/districts?cityId=${city?.id}`);
const district = districts.json?.data?.find((item) => item.name === sample.address.districtName);
check('örnek işin şehir/ilçesi çözüldü', Boolean(city?.id && district?.id));

const customer = await call('POST', '/auth/register', {
  body: {
    email: `offers+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Teklif Duman Testi',
    role: 'CUSTOMER',
  },
});
check('müşteri kaydı 201', customer.status === 201, `status=${customer.status}`);
const token = customer.json?.data?.tokens?.accessToken;

const created = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: sample.category.id,
    title: 'Teklif akışı için açılan talep',
    description: 'Bu talep teklif akışının uçtan uca doğrulanması için oluşturuldu.',
    size: 'SMALL',
    budgetMinor: 200000,
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city?.id, districtId: district?.id },
    attachmentFileIds: [],
    publish: true,
  },
});
const job = created.json?.data;
check('talep yayınlandı', job?.status === 'PUBLISHED', JSON.stringify(created.json)?.slice(0, 300));

console.log('\nTeklif verme:');
const offerCreated = await call('POST', '/offers', {
  token: providerToken,
  body: {
    jobRequestId: job?.id,
    amountMinor: 180000,
    priceType: 'FIXED',
    estimatedDurationMinutes: 120,
    materialsIncluded: true,
    note: 'Malzeme dahil, aynı gün başlayabilirim.',
    validityHours: 48,
  },
});
check('201 döner', offerCreated.status === 201, JSON.stringify(offerCreated.json)?.slice(0, 300));

const offer = offerCreated.json?.data;
check('durum SUBMITTED', offer?.status === 'SUBMITTED', offer?.status);
check('tutar kuruş olarak korunur', offer?.price?.amountMinor === 180000, JSON.stringify(offer?.price));
check('geçerlilik tarihi ileri', new Date(offer?.validUntil).getTime() > Date.now());
check('satıcı özeti döner', typeof offer?.provider?.displayName === 'string', JSON.stringify(offer?.provider)?.slice(0, 200));

const jobAfterOffer = await call('GET', `/jobs/${job?.id}`, { token });
check(
  'talep OFFERS_RECEIVED durumuna geçer',
  jobAfterOffer.json?.data?.status === 'OFFERS_RECEIVED',
  jobAfterOffer.json?.data?.status,
);
check('teklif sayacı arttı', jobAfterOffer.json?.data?.offerCount === 1, String(jobAfterOffer.json?.data?.offerCount));

console.log('\nKurallar:');
const duplicate = await call('POST', '/offers', {
  token: providerToken,
  body: { jobRequestId: job?.id, amountMinor: 190000, priceType: 'FIXED' },
});
check(
  'aynı işe ikinci teklif reddedilir',
  duplicate.json?.error?.code === 'DUPLICATE_OFFER',
  `status=${duplicate.status} code=${duplicate.json?.error?.code}`,
);

const customerOffer = await call('POST', '/offers', {
  token,
  body: { jobRequestId: job?.id, amountMinor: 100000, priceType: 'FIXED' },
});
check('müşteri teklif veremez', customerOffer.status === 403, `status=${customerOffer.status}`);

const tooCheap = await call('POST', '/offers', {
  token: providerToken,
  body: { jobRequestId: job?.id, amountMinor: 1, priceType: 'FIXED' },
});
check(
  'alt sınırın altındaki tutar reddedilir',
  tooCheap.status === 400 || tooCheap.status === 422,
  `status=${tooCheap.status}`,
);

console.log('\nListeleme ve yetki:');
const jobOffers = await call('GET', `/jobs/${job?.id}/offers`, { token });
check('talep sahibi teklifleri listeler', jobOffers.status === 200, `status=${jobOffers.status}`);
check('teklif listede', jobOffers.json?.data?.some((item) => item.id === offer?.id));

const stranger = await call('POST', '/auth/register', {
  body: {
    email: `stranger+${Date.now()}@talpio.test`,
    password: 'Guclu1Parola',
    fullName: 'Yabancı Müşteri',
    role: 'CUSTOMER',
  },
});
const strangerToken = stranger.json?.data?.tokens?.accessToken;
const strangerOffers = await call('GET', `/jobs/${job?.id}/offers`, { token: strangerToken });
check(
  'başka müşteri teklifleri göremez',
  strangerOffers.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerOffers.status} code=${strangerOffers.json?.error?.code}`,
);

const mine = await call('GET', '/offers/mine', { token: providerToken });
check('satıcı kendi tekliflerini listeler', mine.status === 200, `status=${mine.status}`);
check('yeni teklif listede', mine.json?.data?.some((item) => item.id === offer?.id));

const strangerDetail = await call('GET', `/offers/${offer?.id}`, { token: strangerToken });
check(
  'ilgisiz müşteri teklif detayını göremez',
  strangerDetail.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerDetail.status} code=${strangerDetail.json?.error?.code}`,
);

console.log('\nKabul:');
const strangerAccept = await call('POST', `/offers/${offer?.id}/accept`, { token: strangerToken });
check(
  'başka müşteri kabul edemez',
  strangerAccept.json?.error?.code === 'FORBIDDEN_RESOURCE',
  `status=${strangerAccept.status} code=${strangerAccept.json?.error?.code}`,
);

const accepted = await call('POST', `/offers/${offer?.id}/accept`, { token, body: {} });
check('kabul 201 döner', accepted.status === 201, JSON.stringify(accepted.json)?.slice(0, 300));
check('durum ACCEPTED', accepted.json?.data?.status === 'ACCEPTED', accepted.json?.data?.status);
check('yanıt tarihi dolar', Boolean(accepted.json?.data?.respondedAt));

const jobAfterAccept = await call('GET', `/jobs/${job?.id}`, { token });
check(
  'talep PROVIDER_SELECTED durumuna geçer',
  jobAfterAccept.json?.data?.status === 'PROVIDER_SELECTED',
  jobAfterAccept.json?.data?.status,
);

const acceptAgain = await call('POST', `/offers/${offer?.id}/accept`, { token, body: {} });
check(
  'kabul edilmiş teklif tekrar kabul edilemez',
  acceptAgain.json?.error?.code === 'OFFER_NOT_PENDING',
  `status=${acceptAgain.status} code=${acceptAgain.json?.error?.code}`,
);

const withdrawAfterAccept = await call('POST', `/offers/${offer?.id}/withdraw`, {
  token: providerToken,
});
check(
  'kabul edilmiş teklif geri çekilemez',
  withdrawAfterAccept.json?.error?.code === 'OFFER_INVALID_STATUS_TRANSITION',
  `status=${withdrawAfterAccept.status} code=${withdrawAfterAccept.json?.error?.code}`,
);

const lateOffer = await call('POST', '/offers', {
  token: providerToken,
  body: { jobRequestId: job?.id, amountMinor: 150000, priceType: 'FIXED' },
});
check(
  'satıcı seçilmiş talebe yeni teklif verilemez',
  lateOffer.json?.error?.code === 'DUPLICATE_OFFER' ||
    lateOffer.json?.error?.code === 'JOB_NOT_OPEN_FOR_OFFERS',
  `status=${lateOffer.status} code=${lateOffer.json?.error?.code}`,
);

console.log('\nGeri çekme:');
const secondJob = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: sample.category.id,
    title: 'Geri çekme senaryosu için talep',
    description: 'Bu talep teklif geri çekme akışının doğrulanması için oluşturuldu.',
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city?.id, districtId: district?.id },
    attachmentFileIds: [],
    publish: true,
  },
});

const secondOffer = await call('POST', '/offers', {
  token: providerToken,
  body: { jobRequestId: secondJob.json?.data?.id, amountMinor: 220000, priceType: 'STARTING_FROM' },
});
check('ikinci teklif oluşur', secondOffer.status === 201, `status=${secondOffer.status}`);

const withdrawn = await call('POST', `/offers/${secondOffer.json?.data?.id}/withdraw`, {
  token: providerToken,
});
check('geri çekme 201 döner', withdrawn.status === 201, `status=${withdrawn.status}`);
check('durum WITHDRAWN', withdrawn.json?.data?.status === 'WITHDRAWN', withdrawn.json?.data?.status);

console.log('\nRet:');
const thirdJob = await call('POST', '/jobs', {
  token,
  body: {
    categoryId: sample.category.id,
    title: 'Ret senaryosu için talep',
    description: 'Bu talep teklif reddetme akışının doğrulanması için oluşturuldu.',
    preferredTimeSlot: 'FLEXIBLE',
    address: { cityId: city?.id, districtId: district?.id },
    attachmentFileIds: [],
    publish: true,
  },
});

const thirdOffer = await call('POST', '/offers', {
  token: providerToken,
  body: { jobRequestId: thirdJob.json?.data?.id, amountMinor: 260000, priceType: 'FIXED' },
});

const rejected = await call('POST', `/offers/${thirdOffer.json?.data?.id}/reject`, {
  token,
  body: { reason: 'Bütçemin üzerinde' },
});
check('ret 201 döner', rejected.status === 201, `status=${rejected.status}`);
check('durum REJECTED', rejected.json?.data?.status === 'REJECTED', rejected.json?.data?.status);

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exit(failed > 0 ? 1 : 0);
