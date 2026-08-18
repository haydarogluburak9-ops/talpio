import { expect, test, type APIRequestContext } from '@playwright/test';

const password = 'Demo1234!';

type Envelope<T> = { data: T };

async function login(request: APIRequestContext, email: string) {
  const response = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as Envelope<{ tokens: { accessToken: string } }>;
  return body.data.tokens.accessToken;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

test.describe('Talpio production hardening e2e', () => {
  test('giriş (demo)', async ({ request }) => {
    const token = await login(request, 'kullanici@talpio.com');
    expect(token.length).toBeGreaterThan(20);
  });

  test('kayıt', async ({ request }) => {
    const email = `e2e.${Date.now()}@talpio.test`;
    const response = await request.post('/api/v1/auth/register', {
      data: {
        email,
        password,
        fullName: 'E2E Kullanıcı',
        role: 'CUSTOMER',
      },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  });

  test('şifre sıfırlama isteği sızdırmaz', async ({ request }) => {
    const known = await request.post('/api/v1/auth/forgot-password', {
      data: { email: 'kullanici@talpio.com' },
    });
    const missing = await request.post('/api/v1/auth/forgot-password', {
      data: { email: 'missing@talpio.test' },
    });
    expect(known.ok(), await known.text()).toBeTruthy();
    expect(missing.ok(), await missing.text()).toBeTruthy();
  });

  test('commerce request oluşturma', async ({ request }) => {
    const token = await login(request, 'kullanici@talpio.com');
    const categories = await request.get('/api/v1/categories');
    expect(categories.ok()).toBeTruthy();
    const catalog = (await categories.json()) as Envelope<Array<{ id: string }>>;
    const categoryId = catalog.data[0]?.id;
    test.skip(!categoryId, 'katalog boş');

    const cities = await request.get('/api/v1/locations/cities');
    const cityBody = (await cities.json()) as Envelope<Array<{ id: string }>>;
    const cityId = cityBody.data[0]?.id;

    const create = await request.post('/api/v1/requests', {
      headers: auth(token),
      data: {
        requestType: 'PRODUCT_SUPPLY',
        title: 'E2E tedarik talebi',
        description: 'Playwright ürün / tedarik talebi senaryosu',
        categoryId,
        quantity: '1',
        unit: 'adet',
        ...(cityId ? { deliveryCityId: cityId } : {}),
      },
    });
    expect([200, 201].includes(create.status()), await create.text()).toBeTruthy();
  });

  test('teklif verme (ürün / tedarik)', async ({ request }) => {
    const sellerToken = await login(request, 'satici@talpio.com');
    const businesses = await request.get('/api/v1/businesses/mine', {
      headers: auth(sellerToken),
    });
    expect(businesses.ok(), await businesses.text()).toBeTruthy();
    const mine = (await businesses.json()) as Envelope<Array<{ id: string }>>;
    const businessId = mine.data[0]?.id;
    test.skip(!businessId, 'satıcı işletmesi yok');

    const matched = await request.get('/api/v1/requests/matched', {
      headers: auth(sellerToken),
    });
    expect(matched.ok(), await matched.text()).toBeTruthy();
    const list = (await matched.json()) as Envelope<Array<{ id: string }>>;
    const requestId = list.data[0]?.id;
    test.skip(!requestId, 'eşleşen tedarik talebi yok');

    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const offer = await request.post(`/api/v1/requests/${requestId}/offers`, {
      headers: auth(sellerToken),
      data: {
        businessId,
        amountMinor: 150000,
        shippingIncluded: true,
        locationText: 'Istanbul',
        validUntil,
        note: 'E2E tedarik teklifi',
      },
    });
    expect([200, 201, 409].includes(offer.status()), await offer.text()).toBeTruthy();
  });

  test('mesajlaşma', async ({ request }) => {
    const token = await login(request, 'kullanici@talpio.com');
    const list = await request.get('/api/v1/messages/conversations', {
      headers: auth(token),
    });
    expect(list.ok(), await list.text()).toBeTruthy();
    const body = (await list.json()) as Envelope<Array<{ id: string }>>;
    const conversationId = body.data[0]?.id;
    test.skip(!conversationId, 'sohbet yok');

    const send = await request.post(`/api/v1/messages/conversations/${conversationId}/messages`, {
      headers: auth(token),
      data: { type: 'TEXT', body: 'E2E mesaj' },
    });
    expect([200, 201].includes(send.status()), await send.text()).toBeTruthy();
  });

  test('bildirim listesi', async ({ request }) => {
    const token = await login(request, 'kullanici@talpio.com');
    const response = await request.get('/api/v1/notifications', {
      headers: auth(token),
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  });

  test('profil güncelleme', async ({ request }) => {
    const token = await login(request, 'kullanici@talpio.com');
    const response = await request.patch('/api/v1/users/me', {
      headers: auth(token),
      data: { fullName: 'Burak Yılmaz' },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  });

  test('hesap silme', async ({ request }) => {
    const email = `e2e.delete.${Date.now()}@talpio.test`;
    const registered = await request.post('/api/v1/auth/register', {
      data: {
        email,
        password,
        fullName: 'E2E Silinecek',
        role: 'CUSTOMER',
      },
    });
    expect(registered.ok(), await registered.text()).toBeTruthy();
    const session = (await registered.json()) as Envelope<{ tokens: { accessToken: string } }>;
    const removed = await request.delete('/api/v1/users/me', {
      headers: auth(session.data.tokens.accessToken),
    });
    expect([200, 204].includes(removed.status()), await removed.text()).toBeTruthy();

    const replay = await request.post('/api/v1/auth/login', {
      data: { email, password },
    });
    expect(replay.ok()).toBeFalsy();
  });

  test('moderasyon işlemleri (personel)', async ({ request }) => {
    const token = await login(request, 'admin@talpio.com');
    const queue = await request.get('/api/v1/admin/moderation/reports', {
      headers: auth(token),
    });
    expect(queue.ok(), await queue.text()).toBeTruthy();

    const body = (await queue.json()) as Envelope<Array<{ id: string; status: string }>>;
    const open = body.data.find((item) => item.status === 'OPEN') ?? body.data[0];
    if (!open) return;

    const updated = await request.patch(`/api/v1/admin/moderation/reports/${open.id}`, {
      headers: auth(token),
      data: { status: 'REJECTED', actionNote: 'E2E inceleme' },
    });
    expect([200, 400, 422].includes(updated.status()), await updated.text()).toBeTruthy();
  });

  test('sağlık / kuyruk uçları', async ({ request }) => {
    const live = await request.get('/health');
    expect(live.ok()).toBeTruthy();
    const queues = await request.get('/health/queues');
    expect(queues.ok()).toBeTruthy();
    const status = await request.get('/health/status');
    expect(status.ok()).toBeTruthy();
  });
});
