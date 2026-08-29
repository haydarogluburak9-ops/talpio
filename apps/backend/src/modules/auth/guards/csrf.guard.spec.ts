import type { ExecutionContext } from '@nestjs/common';

import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';

import { CsrfGuard } from './csrf.guard';

const config = {
  corsOrigins: ['https://talpio.app', 'https://admin.talpio.app'],
  get: (key: string) => (key === 'API_PUBLIC_URL' ? 'https://api.talpio.app' : ''),
} as unknown as AppConfigService;

interface RequestShape {
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

function contextOf(request: RequestShape, type = 'http'): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({
      getRequest: () => ({ headers: {}, cookies: {}, ...request }),
    }),
  } as unknown as ExecutionContext;
}

const session = { talpio_access: 'jeton' };

describe('CsrfGuard', () => {
  const guard = new CsrfGuard(config);

  it('okuma isteklerine dokunmaz', () => {
    const context = contextOf({ method: 'GET', cookies: session });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('izinli kaynaktan gelen yazma isteğini geçirir', () => {
    const context = contextOf({
      method: 'POST',
      cookies: session,
      headers: { origin: 'https://talpio.app' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('yabancı kaynaktan gelen yazma isteğini reddeder', () => {
    const context = contextOf({
      method: 'POST',
      cookies: session,
      headers: { origin: 'https://kotu-site.example' },
    });

    expect(() => guard.canActivate(context)).toThrow(AppException);
  });

  it('kaynak başlığı olmayan çerezli yazma isteğini reddeder', () => {
    const context = contextOf({ method: 'POST', cookies: session });

    expect(() => guard.canActivate(context)).toThrow(/kaynağı doğrulanamadı/);
  });

  it('Referer başlığına düşer', () => {
    const context = contextOf({
      method: 'POST',
      cookies: session,
      headers: { referer: 'https://admin.talpio.app/kullanicilar' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('Authorization başlığı taşıyan isteği kapsam dışı bırakır', () => {
    // Mobil istemci jetonu kendisi ekler; saldırganın sayfası bu başlığı
    // çapraz kaynakta gönderemez.
    const context = contextOf({
      method: 'POST',
      headers: { authorization: 'Bearer jeton' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('oturum çerezi olmayan isteği kapsam dışı bırakır', () => {
    const context = contextOf({ method: 'POST', headers: {} });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('API kendi kaynağını kabul eder', () => {
    const context = contextOf({
      method: 'POST',
      cookies: session,
      headers: { origin: 'https://api.talpio.app' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('HTTP olmayan bağlamlara karışmaz', () => {
    expect(guard.canActivate(contextOf({ method: 'POST' }, 'ws'))).toBe(true);
  });
});
