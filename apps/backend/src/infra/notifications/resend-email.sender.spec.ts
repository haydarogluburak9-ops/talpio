import { NotificationType } from '@talpio/types';

import type { AppConfigService } from '@config/app-config.service';

import { NotificationOutbox } from './notification-outbox';
import { ResendEmailSender } from './production-notification.senders';

function config(resendApiKey?: string): AppConfigService {
  return {
    notifications: {
      outboxLimit: 200,
      mailFrom: 'Talpio <destek@talpio.app>',
      ...(resendApiKey ? { resendApiKey } : {}),
    },
  } as unknown as AppConfigService;
}

function createSender(apiKey?: string) {
  const appConfig = config(apiKey);
  const outbox = new NotificationOutbox(appConfig);
  return { sender: new ResendEmailSender(appConfig, outbox), outbox };
}

function okResponse(): Response {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve('{"id":"re_1"}'),
  } as unknown as Response;
}

describe('ResendEmailSender', () => {
  const fetchImpl = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchImpl;
  });

  it('kimlik e-postasını Resend uç noktasına düz metin olarak gönderir', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse());
    globalThis.fetch = fetchMock;

    const { sender } = createSender('re_test_key');
    const result = await sender.sendTransactional(
      { email: 'ali@example.com', name: 'Ali' },
      {
        subject: 'Talpio e-posta adresinizi doğrulayın',
        text: 'Bağlantı: https://talpio.app/dogrula-eposta?token=x',
        locale: 'tr',
      },
    );

    expect(result.delivered).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer re_test_key' }),
      }),
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const raw = typeof init?.body === 'string' ? init.body : '';
    const body = JSON.parse(raw) as { to: string[]; subject: string; text: string };
    expect(body.to).toEqual(['ali@example.com']);
    expect(body.subject).toContain('doğrulayın');
    expect(body.text).toContain('dogrula-eposta');
  });

  it('anahtar yoksa ağa çıkmadan başarısız döner', async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    const { sender } = createSender();
    const result = await sender.sendTransactional(
      { email: 'ali@example.com' },
      { subject: 'Konu', text: 'Gövde', locale: 'tr' },
    );

    expect(result.delivered).toBe(false);
    expect(result.failureReason).toMatch(/RESEND_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('HTTP hatasını fırlatmak yerine sonuç olarak döner', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('{"message":"invalid api key"}'),
    });

    const { sender } = createSender('re_bad');
    const result = await sender.send(
      { email: 'ali@example.com' },
      {
        type: NotificationType.OFFER_RECEIVED,
        params: { jobTitle: 'Kombi', providerName: 'Yılmaz', amountMinor: 100, currency: 'TRY' },
        deepLink: null,
        locale: 'tr',
      },
    );

    expect(result.delivered).toBe(false);
    expect(result.failureReason).toBe('Resend HTTP 401');
  });
});
