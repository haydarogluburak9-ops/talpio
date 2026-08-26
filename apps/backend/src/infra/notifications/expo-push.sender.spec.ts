import { NotificationType } from '@talpio/types';

import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';

import { ExpoPushSender } from './expo-push.sender';
import { NotificationOutbox } from './notification-outbox';
import type { NotificationMessage } from './notification-sender';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const message: NotificationMessage = {
  type: NotificationType.OFFER_RECEIVED,
  params: {
    jobTitle: 'Kombi bakımı',
    providerName: 'Yılmaz Ticaret',
    amountMinor: 180000,
    currency: 'TRY',
  },
  deepLink: 'talpio://job-offers/job-1',
  locale: 'tr',
};

function token(index: number): string {
  return `ExponentPushToken[token-${index}]`;
}

/** Expo'nun 200 yanıtı; her jeton için sırayla bir bilet döner. */
function okResponse(tickets: unknown[]): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: tickets }),
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

function config(expoAccessToken?: string): AppConfigService {
  return {
    notifications: {
      outboxLimit: 200,
      ...(expoAccessToken ? { expoAccessToken } : {}),
    },
  } as unknown as AppConfigService;
}

function prismaMock() {
  return {
    deviceToken: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
}

function createSender(options: { accessToken?: string } = {}) {
  const prisma = prismaMock();
  const appConfig = config(options.accessToken);
  const outbox = new NotificationOutbox(appConfig);
  const sender = new ExpoPushSender(appConfig, outbox, prisma as unknown as PrismaService);

  return { sender, prisma, outbox };
}

/** Expo'nun 4xx/5xx yanıtı. */
function httpErrorResponse(status: number, text: string): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(text),
  } as unknown as Response;
}

/** İstek gövdesi hiç işlenemediğinde Expo bilet yerine `errors` döner. */
function requestErrorResponse(message: string): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ errors: [{ message }] }),
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

function mockFetch(): jest.Mock {
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  return fetchMock;
}

function callInit(fetchMock: jest.Mock, callIndex = 0): RequestInit {
  return fetchMock.mock.calls[callIndex]?.[1] as RequestInit;
}

function decodeBody(init: RequestInit): Array<Record<string, unknown>> {
  return JSON.parse(init.body as string) as Array<Record<string, unknown>>;
}

function requestBody(fetchMock: jest.Mock, callIndex = 0): Array<Record<string, unknown>> {
  return decodeBody(callInit(fetchMock, callIndex));
}

/** Expo'nun her iletiyi kabul ettiği yanıt; parça boyutuna göre bilet üretir. */
function acceptAll(_url: string, init: RequestInit): Promise<Response> {
  return Promise.resolve(okResponse(decodeBody(init).map(() => ({ status: 'ok' }))));
}

describe('ExpoPushSender', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('cihaz jetonu yoksa ağa çıkmaz', async () => {
    const fetchMock = mockFetch();
    const { sender } = createSender();

    const result = await sender.send({ tokens: [] }, message);

    expect(result).toEqual({ delivered: false, failureReason: 'Kayıtlı cihaz jetonu yok.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bildirimi gönderir ve tampona yazar', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(okResponse([{ status: 'ok', id: 'ticket-1' }]));
    const { sender, outbox } = createSender();

    const result = await sender.send({ tokens: [token(1)] }, message);

    expect(result).toEqual({ delivered: true, failureReason: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(EXPO_PUSH_URL);
    expect(outbox.list()).toHaveLength(1);
    expect(outbox.list()[0]?.target).toBe(token(1));
  });

  it('başlık ve gövdeyi alıcının diliyle çözer', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(okResponse([{ status: 'ok' }]));
    const { sender } = createSender();

    await sender.send({ tokens: [token(1)] }, message);

    const [payload] = requestBody(fetchMock);

    // Ham enum adı ("OFFER_RECEIVED") kullanıcının bildirim çekmecesine düşmemeli.
    expect(payload?.title).toBe('Yeni teklif aldınız');
    expect(String(payload?.body)).toContain('Yılmaz Ticaret');
    expect(String(payload?.body)).toContain('1.800,00');
    expect(String(payload?.body)).not.toContain('OFFER_RECEIVED');
  });

  it('İngilizce alıcıya İngilizce metin gönderir', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(okResponse([{ status: 'ok' }]));
    const { sender } = createSender();

    await sender.send({ tokens: [token(1)] }, { ...message, locale: 'en' });

    const [payload] = requestBody(fetchMock);

    expect(payload?.title).toBe('You received a new offer');
  });

  it('100 jetonluk parçalara böler', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockImplementation(acceptAll);
    const { sender, outbox } = createSender();

    const tokens = Array.from({ length: 250 }, (_, index) => token(index));
    const result = await sender.send({ tokens }, message);

    expect(result.delivered).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(requestBody(fetchMock, 0)).toHaveLength(100);
    expect(requestBody(fetchMock, 1)).toHaveLength(100);
    expect(requestBody(fetchMock, 2)).toHaveLength(50);
    expect(outbox.list()).toHaveLength(200);
  });

  it('DeviceNotRegistered dönen jetonu kapatır', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(
      okResponse([
        { status: 'ok' },
        { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', message: 'ileti çok büyük', details: { error: 'MessageTooBig' } },
      ]),
    );
    const { sender, prisma } = createSender();

    const result = await sender.send({ tokens: [token(1), token(2), token(3)] }, message);

    // Bir cihaz kabul ettiği sürece gönderim başarılıdır.
    expect(result.delivered).toBe(true);
    expect(prisma.deviceToken.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
      where: { token: { in: [token(2)] }, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('geçerli hatalarda jeton kapatmaz', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(
      okResponse([
        { status: 'error', message: 'kota aşıldı', details: { error: 'MessageRateExceeded' } },
      ]),
    );
    const { sender, prisma } = createSender();

    const result = await sender.send({ tokens: [token(1)] }, message);

    expect(result).toEqual({ delivered: false, failureReason: 'kota aşıldı' });
    expect(prisma.deviceToken.updateMany).not.toHaveBeenCalled();
  });

  it('ağ hatasında fırlatmaz, başarısız döner', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'));
    const { sender, outbox } = createSender();

    const result = await sender.send({ tokens: [token(1)] }, message);

    expect(result.delivered).toBe(false);
    expect(result.failureReason).toContain('timeout');
    expect(outbox.list()).toHaveLength(0);
  });

  it('HTTP hatasında başarısız döner', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(httpErrorResponse(502, 'bad gateway'));
    const { sender } = createSender();

    const result = await sender.send({ tokens: [token(1)] }, message);

    expect(result.delivered).toBe(false);
    expect(result.failureReason).toContain('502');
  });

  it('bir parça düşse diğer parçayı gönderir', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockRejectedValueOnce(new Error('bağlantı koptu')).mockImplementation(acceptAll);
    const { sender, outbox } = createSender();

    const tokens = Array.from({ length: 150 }, (_, index) => token(index));
    const result = await sender.send({ tokens }, message);

    expect(result.delivered).toBe(true);
    expect(outbox.list()).toHaveLength(50);
  });

  it('erişim jetonu tanımlıysa Authorization başlığı ekler', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(okResponse([{ status: 'ok' }]));
    const { sender } = createSender({ accessToken: 'expo-secret' });

    await sender.send({ tokens: [token(1)] }, message);

    expect(callInit(fetchMock).headers).toMatchObject({ Authorization: 'Bearer expo-secret' });
  });

  it('erişim jetonu yoksa Authorization başlığı göndermez', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(okResponse([{ status: 'ok' }]));
    const { sender } = createSender();

    await sender.send({ tokens: [token(1)] }, message);

    expect(callInit(fetchMock).headers).not.toHaveProperty('Authorization');
  });

  it('istek düzeyindeki hatayı raporlar', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(requestErrorResponse('Geçersiz istek gövdesi'));
    const { sender } = createSender();

    const result = await sender.send({ tokens: [token(1)] }, message);

    expect(result).toEqual({ delivered: false, failureReason: 'Geçersiz istek gövdesi' });
  });

  it('jeton temizliği düşse bile gönderim sonucunu bozmaz', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(
      okResponse([
        { status: 'ok' },
        { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } },
      ]),
    );
    const { sender, prisma } = createSender();
    prisma.deviceToken.updateMany.mockRejectedValue(new Error('veritabanı erişilemedi'));

    const result = await sender.send({ tokens: [token(1), token(2)] }, message);

    expect(result).toEqual({ delivered: true, failureReason: null });
  });
});
