import { createApiClient } from '@ustapilot/api-client';

/**
 * Yönetim paneli API istemcisi. Zarf çözümü, hata eşlemesi ve jeton yenileme
 * `@ustapilot/api-client` içinde ortaklaştırılmıştır; web ile aynı davranış.
 *
 * Jetonlar HTTP-only çerezde tutulur: panel tarayıcıda çalıştığı için jetonu
 * JavaScript'in erişebileceği bir yerde tutmak XSS durumunda tüm yönetim
 * yetkisini ele verirdi.
 */
export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  defaultLocale: 'tr',
  defaultHeaders: { 'X-Client-Platform': 'WEB' },
});

export { ApiError } from '@ustapilot/api-client';
export type { ApiErrorDetail } from '@ustapilot/types';
