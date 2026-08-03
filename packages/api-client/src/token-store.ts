import type { AuthTokens } from '@ustapilot/types';

/**
 * Jeton saklama stratejisi. Platforma göre değişir:
 * - Web: jetonlar HTTP-only çerezde tutulur, JavaScript erişemez
 *   (`createCookieTokenStore`); istekler `credentials: 'include'` ile gider.
 * - Admin/SSR olmayan araçlar: bellekte tutulabilir (`createMemoryTokenStore`).
 *
 * Jetonlar hiçbir koşulda `localStorage` içine yazılmaz; XSS durumunda
 * çalınabilir olurlar.
 */
export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
  /** true ise jetonlar çerezde taşınır ve Authorization başlığı eklenmez. */
  readonly usesCookies: boolean;
}

export function createMemoryTokenStore(initial?: AuthTokens | null): TokenStore {
  let tokens: AuthTokens | null = initial ?? null;

  return {
    usesCookies: false,
    getAccessToken: () => Promise.resolve(tokens?.accessToken ?? null),
    getRefreshToken: () => Promise.resolve(tokens?.refreshToken ?? null),
    setTokens: (next) => {
      tokens = next;
      return Promise.resolve();
    },
    clear: () => {
      tokens = null;
      return Promise.resolve();
    },
  };
}

/**
 * Tarayıcı için varsayılan strateji. Jetonlara erişilemez; sunucu Set-Cookie
 * ile yönetir. Yenileme uç noktası da çerez üzerinden çalışır.
 */
export function createCookieTokenStore(): TokenStore {
  return {
    usesCookies: true,
    getAccessToken: () => Promise.resolve(null),
    getRefreshToken: () => Promise.resolve(null),
    setTokens: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };
}

/** Anahtar/değer tabanlı güvenli depolama; mobilde Keychain/Keystore'a karşılık gelir. */
export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const ACCESS_TOKEN_KEY = 'ustapilot.accessToken';
const REFRESH_TOKEN_KEY = 'ustapilot.refreshToken';
const EXPIRES_IN_KEY = 'ustapilot.expiresIn';

/**
 * Mobil için strateji. Bu paket platform bağımsız kaldığından depolama
 * uygulaması (Expo SecureStore gibi) dışarıdan enjekte edilir. Jetonlar cihazın
 * donanım destekli anahtar zincirinde tutulur; düz dosyaya yazılmaz.
 *
 * Bellekte önbelleklenir: her istekte yerel diske gitmek pahalıdır.
 */
export function createSecureTokenStore(storage: SecureStorageAdapter): TokenStore {
  let cached: AuthTokens | null | undefined;

  const load = async (): Promise<AuthTokens | null> => {
    if (cached !== undefined) return cached ?? null;

    const [accessToken, refreshToken, expiresIn] = await Promise.all([
      storage.getItem(ACCESS_TOKEN_KEY),
      storage.getItem(REFRESH_TOKEN_KEY),
      storage.getItem(EXPIRES_IN_KEY),
    ]);

    cached =
      accessToken && refreshToken
        ? { accessToken, refreshToken, expiresIn: Number(expiresIn ?? 0) }
        : null;

    return cached;
  };

  return {
    usesCookies: false,
    getAccessToken: async () => (await load())?.accessToken ?? null,
    getRefreshToken: async () => (await load())?.refreshToken ?? null,
    setTokens: async (next) => {
      cached = next;
      await Promise.all([
        storage.setItem(ACCESS_TOKEN_KEY, next.accessToken),
        storage.setItem(REFRESH_TOKEN_KEY, next.refreshToken),
        storage.setItem(EXPIRES_IN_KEY, String(next.expiresIn)),
      ]);
    },
    clear: async () => {
      cached = null;
      await Promise.all([
        storage.removeItem(ACCESS_TOKEN_KEY),
        storage.removeItem(REFRESH_TOKEN_KEY),
        storage.removeItem(EXPIRES_IN_KEY),
      ]);
    },
  };
}
