import { ERROR_CODES } from '@talpio/types';

import { ApiError } from './errors';
import { HttpClient } from './http-client';
import { createMemoryTokenStore } from './token-store';

interface StubResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

function jsonResponse({ status, body, headers }: StubResponse): Response {
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function stubFetch(responses: StubResponse[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const queue = [...responses];

  const impl = ((url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (!next) throw new Error('Beklenmeyen ek istek');
    return Promise.resolve(jsonResponse(next));
  }) as unknown as typeof fetch;

  return { impl, calls };
}

function makeClient(fetchImpl: typeof fetch, overrides: Record<string, unknown> = {}) {
  return new HttpClient({
    baseUrl: 'http://test.local/api/v1',
    fetchImpl,
    tokenStore: createMemoryTokenStore({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: 900,
    }),
    ...overrides,
  });
}

describe('HttpClient başarı zarfı', () => {
  it('data alanını çözer', async () => {
    const { impl } = stubFetch([{ status: 200, body: { success: true, data: { id: '42' } } }]);
    const client = makeClient(impl);

    await expect(client.get<{ id: string }>('/jobs/42')).resolves.toEqual({ id: '42' });
  });

  it('sorgu parametrelerini serileştirir ve boş değerleri atar', async () => {
    const { impl, calls } = stubFetch([{ status: 200, body: { success: true, data: [] } }]);
    const client = makeClient(impl);

    await client.get('/jobs', { query: { page: 2, search: '', tags: ['a', 'b'], skip: undefined } });

    expect(calls[0]?.url).toBe('http://test.local/api/v1/jobs?page=2&tags=a&tags=b');
  });

  it('sayfalı listede meta bilgisini taşır', async () => {
    const { impl } = stubFetch([
      {
        status: 200,
        body: {
          success: true,
          data: [{ id: '1' }],
          meta: {
            page: 2,
            limit: 20,
            total: 41,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: true,
          },
        },
      },
    ]);
    const client = makeClient(impl);

    const result = await client.paginated<{ id: string }>('/jobs');

    expect(result.items).toHaveLength(1);
    expect(result.meta.totalPages).toBe(3);
  });

  it('Bearer başlığını ekler', async () => {
    const { impl, calls } = stubFetch([{ status: 200, body: { success: true, data: null } }]);
    const client = makeClient(impl);

    await client.get('/users/me');

    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer access-1');
  });
});

describe('HttpClient hata eşlemesi', () => {
  it('sunucu hata kodunu ve mesajını korur', async () => {
    const { impl } = stubFetch([
      {
        status: 409,
        body: {
          success: false,
          error: {
            code: ERROR_CODES.OFFER_ALREADY_ACCEPTED,
            message: 'Bu iş için zaten bir satıcı seçilmiş.',
          },
          requestId: 'req-1',
        },
      },
    ]);
    const client = makeClient(impl);

    await expect(client.post('/offers/1/accept')).rejects.toMatchObject({
      code: ERROR_CODES.OFFER_ALREADY_ACCEPTED,
      status: 409,
      requestId: 'req-1',
    });
  });

  it('alan bazlı doğrulama hatalarını çıkarır', async () => {
    const { impl } = stubFetch([
      {
        status: 422,
        body: {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Gönderilen bilgiler geçerli değil.',
            details: [{ field: 'email', issue: 'Geçerli bir e-posta giriniz' }],
          },
        },
      },
    ]);
    const client = makeClient(impl);

    const error = await client.post('/auth/register', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors).toEqual({ email: 'Geçerli bir e-posta giriniz' });
    expect((error as ApiError).isValidationError).toBe(true);
  });

  it('ağ hatasını ApiError.network olarak döndürür', async () => {
    const impl = (() => Promise.reject(new TypeError('failed to fetch'))) as unknown as typeof fetch;
    const client = makeClient(impl);

    await expect(client.get('/jobs')).rejects.toMatchObject({ status: 0 });
  });

  it('zarfsız uçta beklenmeyen durumu hataya çevirir', async () => {
    const { impl } = stubFetch([{ status: 500, body: { status: 'error' } }]);
    const client = makeClient(impl);

    await expect(
      client.get('/health/ready', { raw: true, acceptStatuses: [200, 503] }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('zarfsız uçta kabul edilen durumu ayrıştırır', async () => {
    const { impl } = stubFetch([{ status: 503, body: { status: 'error' } }]);
    const client = makeClient(impl);

    await expect(
      client.get<{ status: string }>('/health/ready', { raw: true, acceptStatuses: [200, 503] }),
    ).resolves.toEqual({ status: 'error' });
  });
});

describe('HttpClient jeton yenileme', () => {
  it('401 sonrası jetonu yeniler ve isteği tekrarlar', async () => {
    const { impl, calls } = stubFetch([
      { status: 401, body: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'süre doldu' } } },
      {
        status: 200,
        body: {
          success: true,
          // Uç nokta oturumun tamamını döner; istemci yalnızca jetonları saklar.
          data: {
            user: { id: 'user-1' },
            tokens: { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 },
          },
        },
      },
      { status: 200, body: { success: true, data: { id: 'user-1' } } },
    ]);
    const client = makeClient(impl);

    await expect(client.get<{ id: string }>('/users/me')).resolves.toEqual({ id: 'user-1' });

    expect(calls).toHaveLength(3);
    expect(calls[1]?.url).toContain('/auth/refresh');
    const retryHeaders = calls[2]?.init.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer access-2');
  });

  it('yenileme başarısızsa oturumu kapatma geri çağrısını tetikler', async () => {
    const onUnauthorized = jest.fn();
    const { impl } = stubFetch([
      { status: 401, body: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'süre doldu' } } },
      { status: 401, body: { success: false, error: { code: 'TOKEN_INVALID', message: 'geçersiz' } } },
    ]);
    const client = makeClient(impl, { onUnauthorized });

    await expect(client.get('/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('yenileme isteğinin kendisi için tekrar yenileme denemez', async () => {
    const { impl, calls } = stubFetch([
      { status: 401, body: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'süre doldu' } } },
      { status: 401, body: { success: false, error: { code: 'TOKEN_INVALID', message: 'geçersiz' } } },
    ]);
    const client = makeClient(impl);

    await expect(client.get('/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(calls).toHaveLength(2);
  });
});
