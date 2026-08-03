import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema';

/**
 * Doğrulanmış ortam değişkenlerine tip güvenli erişim sağlar.
 * Uygulama kodu `process.env`'e doğrudan erişmez.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get port(): number {
    return this.get('API_PORT');
  }

  get apiPrefix(): string {
    return this.get('API_PREFIX');
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS');
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.get('LOG_LEVEL');
  }

  get redis(): { host: string; port: number; password?: string; db: number } {
    const password = this.get('REDIS_PASSWORD');
    return {
      host: this.get('REDIS_HOST'),
      port: this.get('REDIS_PORT'),
      db: this.get('REDIS_DB'),
      ...(password ? { password } : {}),
    };
  }

  get throttle(): { ttlSeconds: number; limit: number; authLimit: number } {
    return {
      ttlSeconds: this.get('THROTTLE_TTL_SECONDS'),
      limit: this.get('THROTTLE_LIMIT'),
      authLimit: this.get('AUTH_THROTTLE_LIMIT'),
    };
  }

  get storage(): {
    driver: Env['STORAGE_DRIVER'];
    endpoint: string;
    publicUrl: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
    maxUploadBytes: number;
    allowedImageMime: string[];
    allowedDocumentMime: string[];
  } {
    return {
      driver: this.get('STORAGE_DRIVER'),
      endpoint: this.get('S3_ENDPOINT'),
      publicUrl: this.get('S3_PUBLIC_URL'),
      region: this.get('S3_REGION'),
      bucket: this.get('S3_BUCKET'),
      accessKey: this.get('S3_ACCESS_KEY'),
      secretKey: this.get('S3_SECRET_KEY'),
      forcePathStyle: this.get('S3_FORCE_PATH_STYLE'),
      maxUploadBytes: this.get('MAX_UPLOAD_SIZE_MB') * 1024 * 1024,
      allowedImageMime: this.get('ALLOWED_IMAGE_MIME'),
      allowedDocumentMime: this.get('ALLOWED_DOCUMENT_MIME'),
    };
  }

  /** Herkese açık dosyaların tarayıcıdan erişilebilir kök adresi. */
  get fileBaseUrl(): string {
    return `${this.get('S3_PUBLIC_URL')}/${this.get('S3_BUCKET')}`;
  }

  get defaultLocale(): string {
    return this.get('DEFAULT_LOCALE');
  }

  get supportedLocales(): string[] {
    return this.get('SUPPORTED_LOCALES');
  }

  get defaultCurrency(): string {
    return this.get('DEFAULT_CURRENCY');
  }
}
