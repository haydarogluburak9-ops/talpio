/**
 * Kimlik akışının uçtan uca duman testi.
 *
 * Çalışan bir API ve tohumlanmış veritabanı gerektirir. Test veritabanı
 * kullanmaz; her çalıştırmada zaman damgalı yeni bir e-posta üretir.
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

async function call(method, path, { body, token, platform = 'IOS' } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': platform,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, json, headers: response.headers };
}

const email = `smoke+${Date.now()}@talpio.test`;
const password = 'Guclu1Parola';

console.log(`Kimlik duman testi — ${BASE}\n`);

console.log('Kayıt:');
const registered = await call('POST', '/auth/register', {
  body: { email, password, fullName: 'Duman Test', role: 'CUSTOMER' },
});
check('201 döner', registered.status === 201, `status=${registered.status}`);
check('başarı zarfı', registered.json?.success === true, JSON.stringify(registered.json)?.slice(0, 200));
check('erişim jetonu verilir', typeof registered.json?.data?.tokens?.accessToken === 'string');
check('yenileme jetonu verilir', typeof registered.json?.data?.tokens?.refreshToken === 'string');
check('parola özeti sızdırılmaz', !JSON.stringify(registered.json).includes('passwordHash'));
check('rol doğru', registered.json?.data?.user?.role === 'CUSTOMER');

const tokens = registered.json?.data?.tokens ?? {};

console.log('\nAynı e-posta ile tekrar kayıt:');
const duplicate = await call('POST', '/auth/register', {
  body: { email, password, fullName: 'Duman Test', role: 'CUSTOMER' },
});
check('409 çakışma', duplicate.status === 409, `status=${duplicate.status}`);
check('EMAIL_ALREADY_EXISTS kodu', duplicate.json?.error?.code === 'EMAIL_ALREADY_EXISTS', duplicate.json?.error?.code);

console.log('\nZayıf parola ile kayıt:');
const weak = await call('POST', '/auth/register', {
  body: { email: `weak+${Date.now()}@talpio.test`, password: 'zayif', fullName: 'Zayıf', role: 'CUSTOMER' },
});
check('422 doğrulama hatası', weak.status === 422, `status=${weak.status}`);

console.log('\nGiriş:');
const login = await call('POST', '/auth/login', { body: { email, password } });
check('200 döner', login.status === 200, `status=${login.status}`);
check('yeni jeton verilir', login.json?.data?.tokens?.accessToken !== tokens.accessToken);

console.log('\nYanlış parola:');
const badLogin = await call('POST', '/auth/login', { body: { email, password: 'YanlisParola1' } });
check('401 döner', badLogin.status === 401, `status=${badLogin.status}`);
check('INVALID_CREDENTIALS kodu', badLogin.json?.error?.code === 'INVALID_CREDENTIALS', badLogin.json?.error?.code);

console.log('\nOlmayan kullanıcı:');
const ghost = await call('POST', '/auth/login', { body: { email: 'yok@talpio.test', password } });
check('401 döner (hesap varlığı sızdırılmaz)', ghost.status === 401, `status=${ghost.status}`);
check('mesaj yanlış paroladakiyle aynı', ghost.json?.error?.code === badLogin.json?.error?.code);

console.log('\nKorumalı uç (/auth/me):');
const accessToken = login.json?.data?.tokens?.accessToken;
const me = await call('GET', '/auth/me', { token: accessToken });
check('200 döner', me.status === 200, `status=${me.status}`);
check('doğru kullanıcı', me.json?.data?.email === email, me.json?.data?.email);
check('izinler döner', Array.isArray(me.json?.data?.permissions) && me.json.data.permissions.length > 0);

const noToken = await call('GET', '/auth/me');
check('jetonsuz istek 401', noToken.status === 401, `status=${noToken.status}`);

const badToken = await call('GET', '/auth/me', { token: 'gecersiz.jeton.dizisi' });
check('geçersiz jeton 401', badToken.status === 401, `status=${badToken.status}`);

console.log('\nJeton yenileme:');
const refreshToken = login.json?.data?.tokens?.refreshToken;
const refreshed = await call('POST', '/auth/refresh', { body: { refreshToken } });
check('200 döner', refreshed.status === 200, `status=${refreshed.status}`);
check('yeni erişim jetonu', refreshed.json?.data?.tokens?.accessToken !== accessToken);
check('yenileme jetonu döndürülür', refreshed.json?.data?.tokens?.refreshToken !== refreshToken);

const reused = await call('POST', '/auth/refresh', { body: { refreshToken } });
check('kullanılmış jeton reddedilir', reused.status === 401, `status=${reused.status}`);

console.log('\nÇıkış:');
const finalRefresh = refreshed.json?.data?.tokens?.refreshToken;
const loggedOut = await call('POST', '/auth/logout', { body: { refreshToken: finalRefresh } });
check('200 döner', loggedOut.status === 200, `status=${loggedOut.status}`);

const afterLogout = await call('POST', '/auth/refresh', { body: { refreshToken: finalRefresh } });
check('çıkıştan sonra yenileme başarısız', afterLogout.status === 401, `status=${afterLogout.status}`);

const staleAccess = await call('GET', '/auth/me', {
  token: refreshed.json?.data?.tokens?.accessToken,
});
check('çıkıştan sonra erişim jetonu geçersiz', staleAccess.status === 401, `status=${staleAccess.status}`);

console.log('\nDemo hesapları:');
for (const account of ['kullanici@talpio.com', 'satici@talpio.com']) {
  const demo = await call('POST', '/auth/login', {
    body: { email: account, password: process.env.DEMO_PASSWORD ?? 'yerel_demo_parolasi' },
  });
  check(`${account} giriş yapabiliyor`, demo.status === 200, `status=${demo.status}`);
}

console.log('\nHerkese açık uçlar:');
const categories = await call('GET', '/categories');
check('kategoriler jetonsuz erişilebilir', categories.status === 200, `status=${categories.status}`);
check('kategori verisi dolu', (categories.json?.data?.length ?? 0) > 0);

const cities = await call('GET', '/locations/cities?countryCode=TR');
check('şehirler jetonsuz erişilebilir', cities.status === 200, `status=${cities.status}`);

console.log('\nWeb istemcisi (çerez akışı):');
const webLogin = await call('POST', '/auth/login', { body: { email, password }, platform: 'WEB' });
const setCookie = webLogin.headers.get('set-cookie') ?? '';
check('yenileme çerezi gönderilir', setCookie.includes('talpio_refresh'), setCookie.slice(0, 80));
check('çerez HttpOnly', /httponly/i.test(setCookie));
check('çerez yolu kimlik uçlarıyla sınırlı', /path=\/api\/v1\/auth/i.test(setCookie), setCookie);

const mobileLogin = await call('POST', '/auth/login', { body: { email, password }, platform: 'ANDROID' });
check('mobilde çerez gönderilmez', !(mobileLogin.headers.get('set-cookie') ?? '').includes('talpio_refresh'));

console.log(`\n${passed} geçti, ${failed} başarısız`);
process.exitCode = failed > 0 ? 1 : 0;
