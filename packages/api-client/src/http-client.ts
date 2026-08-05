import { API_ROUTES } from '@ustapilot/config';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthSession,
  AuthTokens,
  PaginationMeta,
} from '@ustapilot/types';

import { ApiError } from './errors';
import { createCookieTokenStore } from './token-store';
import type { TokenStore } from './token-store';

export interface HttpClientOptions {
  /** Örn. http://localhost:3000/api/v1 */
  baseUrl: string;
  tokenStore?: TokenStore;
  defaultLocale?: string;
  /** Her isteğe eklenen sabit başlıklar (örn. `X-Client-Platform`). */
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  /** 401 alındığında jeton yenileme denensin mi? */
  autoRefresh?: boolean;
  /** Yenileme de başarısız olduğunda çağrılır; uygulama oturumu kapatır. */
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, unknown> | undefined;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Zarf beklemeyen uçlar (sağlık kontrolü gibi). */
  raw?: boolean;
  /** `raw` modda hata sayılmayacak ek durum kodları. */
  acceptStatuses?: number[];
  /** Bu istek için jeton yenileme denenmesin (yenileme çağrısının kendisi). */
  skipAuthRefresh?: boolean;
}

/**
 * Sayfalı liste sonucu.
 *
 * `M` üst veriyi genişleten uçlar için ayrılmıştır: bildirim listesi
 * sayfalamanın yanında okunmamış sayacını da taşır ve çağıran bunu tip
 * kaybetmeden okur.
 */
export interface Paginated<T, M extends PaginationMeta = PaginationMeta> {
  items: T[];
  meta: M;
}

/** React Native'in `FormData` için beklediği yerel dosya tanımlayıcısı. */
export interface NativeFile {
  uri: string;
  name: string;
  type: string;
}

/** Tarayıcıda `Blob`/`File`, React Native'de yerel dosya tanımlayıcısı. */
export type UploadFile = Blob | NativeFile;

function isBlob(file: UploadFile): file is Blob {
  return typeof Blob !== 'undefined' && file instanceof Blob;
}

function buildQueryString(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.append(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * Tüm istemcilerin paylaştığı HTTP katmanı.
 *
 * Sorumlulukları: standart zarfı açmak, hataları [ApiError]'a çevirmek,
 * erişim jetonu süresi dolduğunda tek seferlik yenileme yapmak ve eşzamanlı
 * isteklerin aynı anda birden fazla yenileme tetiklemesini engellemek.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenStore: TokenStore;
  private readonly timeoutMs: number;
  private readonly autoRefresh: boolean;
  private readonly fetchImpl: typeof fetch;
  private readonly onUnauthorized: (() => void) | undefined;
  private readonly defaultHeaders: Record<string, string>;
  private locale: string;

  /** Aynı anda gelen 401'lerin tek bir yenileme isteği paylaşmasını sağlar. */
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.tokenStore = options.tokenStore ?? createCookieTokenStore();
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.autoRefresh = options.autoRefresh ?? true;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.onUnauthorized = options.onUnauthorized;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.locale = options.defaultLocale ?? 'tr';
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  /** API ön ekinin dışında kalan uçlar için sunucu kökü. */
  get origin(): string {
    return new URL(this.baseUrl).origin;
  }

  get tokens(): TokenStore {
    return this.tokenStore;
  }

  /** Oturum açıldıktan sonra jetonları platformun deposuna yazar. */
  saveTokens(tokens: AuthTokens): Promise<void> {
    return this.tokenStore.setTokens(tokens);
  }

  clearTokens(): Promise<void> {
    return this.tokenStore.clear();
  }

  readRefreshToken(): Promise<string | null> {
    return this.tokenStore.getRefreshToken();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.send(path, options);

    if (options.raw) {
      const accepted = options.acceptStatuses ?? [200];
      if (!response.ok && !accepted.includes(response.status)) {
        throw ApiError.fromStatus(response.status, this.requestIdOf(response));
      }
      return (await this.parseJson(response)) as T;
    }

    const payload = (await this.parseJson(response)) as
      | ApiSuccessResponse<T>
      | ApiErrorResponse
      | null;

    if (payload === null) {
      if (response.ok) return undefined as T;
      throw ApiError.fromStatus(response.status, this.requestIdOf(response));
    }

    if (payload.success === false) {
      throw ApiError.fromBody(payload.error, response.status, payload.requestId);
    }

    return payload.data;
  }

  async paginated<T, M extends PaginationMeta = PaginationMeta>(
    path: string,
    options: RequestOptions = {},
  ): Promise<Paginated<T, M>> {
    const response = await this.send(path, options);
    const payload = (await this.parseJson(response)) as
      | ApiSuccessResponse<T[]>
      | ApiErrorResponse
      | null;

    if (payload === null) throw ApiError.fromStatus(response.status, this.requestIdOf(response));
    if (payload.success === false) {
      throw ApiError.fromBody(payload.error, response.status, payload.requestId);
    }

    const fallback: PaginationMeta = {
      page: 1,
      limit: payload.data.length,
      total: payload.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    // Zarf üst verisi çalışma anında gelir; genişletilmiş alanlar yalnızca
    // çağıranın seçtiği tipte tanımlıdır.
    return { items: payload.data, meta: (payload.meta ?? fallback) as M };
  }

  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  put<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Dosya yükler. İlerleme takibi gerektiğinde çağıran taraf XHR kullanmalıdır;
   * fetch akış tabanlı ilerleme bildirmez.
   */
  async upload<T>(
    path: string,
    file: UploadFile,
    fields: Record<string, string> = {},
    options: Omit<RequestOptions, 'body' | 'method'> = {},
  ): Promise<T> {
    const form = new FormData();

    if (isBlob(file)) {
      // Dosya adı olmadan bazı sunucu ayrıştırıcıları parçayı düz alan sayar;
      // ad her zaman gönderilir.
      form.append('file', file, 'upload');
    } else {
      // React Native `Blob` parçalarını güvenilir taşımaz; yerel dosya
      // tanımlayıcısı doğrudan verilir.
      form.append('file', file as unknown as Blob);
    }

    for (const [key, value] of Object.entries(fields)) form.append(key, value);

    return this.request<T>(path, { ...options, method: 'POST', body: form });
  }

  private async send(path: string, options: RequestOptions): Promise<Response> {
    const attempt = async (): Promise<Response> => {
      // Mutlak adres verildiğinde taban adres uygulanmaz; sağlık uçları gibi
      // API ön ekinin dışında kalan yollar bu şekilde çağrılır.
      const base = /^https?:\/\//.test(path) ? '' : this.baseUrl;
      const url = `${base}${path}${buildQueryString(options.query)}`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Accept-Language': this.locale,
        ...this.defaultHeaders,
        ...options.headers,
      };

      const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
      if (options.body !== undefined && !isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      if (!this.tokenStore.usesCookies) {
        const accessToken = await this.tokenStore.getAccessToken();
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      if (options.signal) {
        if (options.signal.aborted) controller.abort();
        else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      try {
        return await this.fetchImpl(url, {
          method: options.method ?? 'GET',
          headers,
          credentials: this.tokenStore.usesCookies ? 'include' : 'same-origin',
          signal: controller.signal,
          ...(options.body !== undefined
            ? { body: isFormData ? (options.body as FormData) : JSON.stringify(options.body) }
            : {}),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // Çağıran taraf iptal ettiyse hatayı olduğu gibi yukarı taşırız.
          if (options.signal?.aborted) throw error;
          throw ApiError.timeout();
        }
        throw ApiError.network();
      } finally {
        clearTimeout(timeout);
      }
    };

    let response = await attempt();

    const shouldRefresh =
      response.status === 401 && this.autoRefresh && options.skipAuthRefresh !== true;

    if (shouldRefresh && (await this.refreshTokens())) {
      response = await attempt();
    }

    if (response.status === 401 && options.skipAuthRefresh !== true) {
      this.onUnauthorized?.();
    }

    return response;
  }

  private async refreshTokens(): Promise<boolean> {
    this.refreshPromise ??= this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const refreshToken = await this.tokenStore.getRefreshToken();
      if (!this.tokenStore.usesCookies && !refreshToken) return false;

      // Uç nokta oturumun tamamını (kullanıcı + jetonlar) döner.
      const session = await this.request<AuthSession>(API_ROUTES.auth.refresh, {
        method: 'POST',
        skipAuthRefresh: true,
        ...(refreshToken ? { body: { refreshToken } } : {}),
      });

      await this.tokenStore.setTokens(session.tokens);
      return true;
    } catch {
      await this.tokenStore.clear();
      return false;
    }
  }

  private async parseJson(response: Response): Promise<unknown> {
    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      throw ApiError.fromStatus(response.status, this.requestIdOf(response));
    }
  }

  private requestIdOf(response: Response): string | undefined {
    return response.headers.get('x-request-id') ?? undefined;
  }
}
