import { Platform } from 'react-native';

import { createApiClient, createSecureTokenStore } from '@talpio/api-client';

import { env } from '@/lib/env';
import { secureStorage } from '@/lib/secure-storage';

/**
 * Mobil API istemcisi. Zarf çözümü, hata eşlemesi, jeton yenileme ve istek
 * iptali web ile ortak koddan gelir; yalnızca jeton saklama stratejisi farklı.
 */
export const tokenStore = createSecureTokenStore(secureStorage);

export const apiClient = createApiClient({
  baseUrl: env.apiUrl,
  tokenStore,
  defaultLocale: env.defaultLocale,
  // Sunucu bu başlığa göre çerez yerine gövdeyle jeton döndürür.
  defaultHeaders: { 'X-Client-Platform': Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
});

export { ApiError } from '@talpio/api-client';
