/**
 * Backend API istemcisi.
 * Tüm yanıtlar `{ success, data, meta }` zarfıyla gelir; bu katman zarfı açar ve
 * hataları tek bir `ApiError` tipine dönüştürür.
 */

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[],
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Ağ hatası, zaman aşımı gibi sunucuya ulaşamama durumları. */
  static network(cause: unknown): ApiError {
    return new ApiError(
      'NETWORK_ERROR',
      'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.',
      0,
      undefined,
      undefined,
    ).withCause(cause);
  }

  private withCause(cause: unknown): this {
    this.cause = cause;
    return this;
  }
}

interface EnvelopeSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface EnvelopeError {
  success: false;
  error: { code: string; message: string; details?: ApiErrorDetail[] };
  requestId?: string;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Zarfsız dönen uçlar (örn. /health) için. */
  raw?: boolean;
  /**
   * Raw modda hata sayılmayacak ek HTTP durumları.
   * Sağlık kontrolü bozuk durumda 503 döner ama gövdesi hâlâ anlamlıdır.
   */
  acceptStatuses?: number[];
  accessToken?: string;
}

export interface ApiResult<T> {
  data: T;
  meta?: Record<string, unknown>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { body, raw = false, acceptStatuses = [], accessToken, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  requestHeaders.set('Accept-Language', 'tr');
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      ...rest,
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    throw ApiError.network(cause);
  }

  const text = await response.text();
  const payload: unknown = text ? JSON.parse(text) : null;

  if (raw) {
    if (!response.ok && !acceptStatuses.includes(response.status)) {
      throw new ApiError('HTTP_ERROR', `Beklenmeyen yanıt (${response.status})`, response.status);
    }
    return { data: payload as T };
  }

  if (!isEnvelope(payload)) {
    throw new ApiError(
      'INVALID_RESPONSE',
      'Sunucudan beklenmeyen biçimde yanıt alındı.',
      response.status,
    );
  }

  if (!payload.success) {
    const failure = payload as EnvelopeError;
    throw new ApiError(
      failure.error.code,
      failure.error.message,
      response.status,
      failure.error.details,
      failure.requestId,
    );
  }

  const success = payload as EnvelopeSuccess<T>;
  return { data: success.data, ...(success.meta ? { meta: success.meta } : {}) };
}

function isEnvelope(payload: unknown): payload is EnvelopeSuccess<unknown> | EnvelopeError {
  return typeof payload === 'object' && payload !== null && 'success' in payload;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
