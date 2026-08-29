import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';

/** Durum değiştirmeyen yöntemler CSRF açısından zararsızdır. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const SESSION_COOKIES = ['talpio_access', 'talpio_refresh'];

/**
 * Çerezle kimliklenen yazma isteklerinde isteğin bizim arayüzümüzden geldiğini
 * doğrular.
 *
 * Tarayıcı, oturum çerezini isteğe kendisi ekler; dolayısıyla başka bir sitedeki
 * form ya da betik, kullanıcı adına yazma isteği tetikleyebilir. `SameSite=lax`
 * bunun çoğunu engeller, ancak dosya yükleme gibi çok parçalı gövdeler ön
 * denetim (preflight) tetiklemediği için tek başına yeterli sayılmaz.
 *
 * Doğrulama, çerez yerine `Origin` başlığı üzerinden yapılır: başlığı tarayıcı
 * ekler ve sayfadaki betik değiştiremez. Çift gönderimli jeton yöntemi de
 * kullanılabilirdi; ancak o yöntem, jeton çerezi henüz oluşmamış açık
 * oturumların dağıtımdan hemen sonra yazma yapamaması demekti.
 *
 * `Authorization` başlığı taşıyan istekler kapsam dışıdır: mobil istemci
 * jetonu kendisi ekler ve saldırganın sayfası çapraz kaynakta bu başlığı ön
 * denetimden geçmeden gönderemez.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(config: AppConfigService) {
    this.allowedOrigins = new Set(
      // API kendi kaynağı da listeye girer; Swagger arayüzü aynı kaynaktan
      // çağrı yapar ve CORS listesinde yer almaz.
      [...config.corsOrigins, config.get('API_PUBLIC_URL')]
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<Request>();
    const method = (request.method ?? 'GET').toUpperCase();

    if (SAFE_METHODS.has(method)) return true;
    if (request.headers.authorization) return true;
    if (!hasSessionCookie(request)) return true;

    const origin = requestOrigin(request);

    // Başlık yoksa isteğin tarayıcıdan gelmediğini varsayamayız: çerezi taşıyan
    // bir istemci söz konusu ve kaynağı doğrulanamıyor.
    if (!origin) {
      throw new AppException('FORBIDDEN', {
        message: 'İsteğin kaynağı doğrulanamadı.',
      });
    }

    if (!this.allowedOrigins.has(origin)) {
      throw new AppException('FORBIDDEN', {
        message: 'İsteğin kaynağı doğrulanamadı.',
        context: { origin },
      });
    }

    return true;
  }
}

function hasSessionCookie(request: Request): boolean {
  const cookies: unknown = (request as { cookies?: unknown }).cookies;
  if (typeof cookies !== 'object' || cookies === null) return false;

  const bag = cookies as Record<string, unknown>;
  return SESSION_COOKIES.some((name) => typeof bag[name] === 'string');
}

/**
 * `Origin` başlığı yazma isteklerinde tarayıcı tarafından gönderilir. Bazı
 * istemciler yalnızca `Referer` gönderdiği için onun kaynak kısmına düşülür.
 */
function requestOrigin(request: Request): string | null {
  const origin = request.headers.origin;
  if (typeof origin === 'string' && origin !== 'null') return normalizeOrigin(origin) || null;

  const referer = request.headers.referer;
  if (typeof referer === 'string') return normalizeOrigin(referer) || null;

  return null;
}

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}
