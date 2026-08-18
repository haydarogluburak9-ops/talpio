import { createApiClient } from '@talpio/api-client';

import { publicEnv } from './env';

/**
 * Tarayıcı istemcisi. Jetonlar HTTP-only çerezde tutulduğu için istekler
 * `credentials: 'include'` ile gider ve JavaScript jetona hiç dokunmaz.
 */
export const apiClient = createApiClient({
  baseUrl: publicEnv.apiUrl,
  defaultLocale: publicEnv.defaultLocale,
  // Sunucu bu başlığı görünce yenileme jetonunu çerezle gönderir.
  defaultHeaders: { 'X-Client-Platform': 'WEB' },
});

export { ApiError } from '@talpio/api-client';
