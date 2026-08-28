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

  /**
   * Ortam internete açık bir sunucuda mı çalışıyor?
   *
   * Sertleştirme kararları `isProduction` yerine buna bakmalı: `staging` de
   * gerçek bir alan adı ve gerçek kullanıcılarla yayında olabilir. Bu ayrım
   * yapılmadığında çerezler `Secure` bayrağını kaybediyor ve API dokümanı
   * herkese açık kalıyordu.
   */
  get isDeployed(): boolean {
    return this.nodeEnv === 'staging' || this.nodeEnv === 'production';
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

  get payment(): {
    driver: Env['PAYMENT_DRIVER'];
    currency: string;
    webhookSecret: string;
    defaultCommissionBps: number;
    defaultCommissionFixedMinor: number;
    iyzicoApiKey?: string;
    iyzicoSecretKey?: string;
    iyzicoBaseUrl: string;
  } {
    const iyzicoApiKey = this.get('IYZICO_API_KEY');
    const iyzicoSecretKey = this.get('IYZICO_SECRET_KEY');
    return {
      driver: this.get('PAYMENT_DRIVER'),
      currency: this.get('PAYMENT_CURRENCY'),
      webhookSecret: this.get('PAYMENT_WEBHOOK_SECRET'),
      defaultCommissionBps: this.get('DEFAULT_COMMISSION_BPS'),
      defaultCommissionFixedMinor: this.get('DEFAULT_COMMISSION_FIXED_MINOR'),
      iyzicoBaseUrl: this.get('IYZICO_BASE_URL'),
      ...(iyzicoApiKey ? { iyzicoApiKey } : {}),
      ...(iyzicoSecretKey ? { iyzicoSecretKey } : {}),
    };
  }

  get notifications(): {
    pushDriver: Env['PUSH_DRIVER'];
    mailDriver: Env['MAIL_DRIVER'];
    smsDriver: Env['SMS_DRIVER'];
    mailFrom: string;
    smsSender: string;
    /** Mock sürücülerin bellek içinde tuttuğu gönderim sayısı. */
    outboxLimit: number;
    /** Expo Push API için isteğe bağlı erişim jetonu. */
    expoAccessToken?: string;
    smtpHost?: string;
    smtpPort: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure: boolean;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFrom?: string;
    netgsmUser?: string;
    netgsmPass?: string;
    netgsmHeader?: string;
  } {
    const expoAccessToken = this.get('EXPO_ACCESS_TOKEN');
    const smtpHost = this.get('SMTP_HOST');
    const smtpUser = this.get('SMTP_USER');
    const smtpPass = this.get('SMTP_PASS');
    const twilioAccountSid = this.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = this.get('TWILIO_FROM');
    const netgsmUser = this.get('NETGSM_USER');
    const netgsmPass = this.get('NETGSM_PASS');
    const netgsmHeader = this.get('NETGSM_HEADER');
    return {
      pushDriver: this.get('PUSH_DRIVER'),
      mailDriver: this.get('MAIL_DRIVER'),
      smsDriver: this.get('SMS_DRIVER'),
      mailFrom: this.get('MAIL_FROM'),
      smsSender: this.get('SMS_SENDER'),
      outboxLimit: this.get('NOTIFICATION_OUTBOX_LIMIT'),
      smtpPort: this.get('SMTP_PORT'),
      smtpSecure: this.get('SMTP_SECURE'),
      ...(expoAccessToken ? { expoAccessToken } : {}),
      ...(smtpHost ? { smtpHost } : {}),
      ...(smtpUser ? { smtpUser } : {}),
      ...(smtpPass ? { smtpPass } : {}),
      ...(twilioAccountSid ? { twilioAccountSid } : {}),
      ...(twilioAuthToken ? { twilioAuthToken } : {}),
      ...(twilioFrom ? { twilioFrom } : {}),
      ...(netgsmUser ? { netgsmUser } : {}),
      ...(netgsmPass ? { netgsmPass } : {}),
      ...(netgsmHeader ? { netgsmHeader } : {}),
    };
  }

  get ai(): {
    driver: Env['AI_DRIVER'];
    openaiApiKey?: string;
    anthropicApiKey?: string;
    timeoutMs: number;
    maxRetries: number;
    defaultModel: string;
  } {
    const openaiApiKey = this.get('AI_OPENAI_API_KEY');
    const anthropicApiKey = this.get('AI_ANTHROPIC_API_KEY');
    return {
      driver: this.get('AI_DRIVER'),
      ...(openaiApiKey ? { openaiApiKey } : {}),
      ...(anthropicApiKey ? { anthropicApiKey } : {}),
      timeoutMs: this.get('AI_TIMEOUT_MS'),
      maxRetries: this.get('AI_MAX_RETRIES'),
      defaultModel: this.get('AI_DEFAULT_MODEL'),
    };
  }

  get outboxPollMs(): number {
    return this.get('OUTBOX_POLL_MS');
  }

  get workerConcurrency(): number {
    return this.get('WORKER_CONCURRENCY');
  }

  /** Herkese açık dosyaların tarayıcıdan erişilebilir kök adresi (CDN veya S3). */
  get fileBaseUrl(): string {
    const cdn = this.get('CDN_PUBLIC_URL');
    if (cdn) return cdn.replace(/\/$/, '');
    return `${this.get('S3_PUBLIC_URL')}/${this.get('S3_BUCKET')}`;
  }

  get databaseReadUrl(): string | undefined {
    const read = this.get('DATABASE_READ_URL');
    if (!read || read.length === 0) return undefined;
    return read;
  }

  get feedCacheTtlSeconds(): number {
    return this.get('FEED_CACHE_TTL_SECONDS');
  }

  get storyTtlHours(): number {
    return this.get('STORY_TTL_HOURS');
  }

  /** Lansman öncesi demo hikâye otomatik yenileme. */
  get demoStoryRefreshEnabled(): boolean {
    return this.get('DEMO_STORY_REFRESH_ENABLED');
  }

  get demoStoryRefreshIntervalMs(): number {
    return this.get('DEMO_STORY_REFRESH_INTERVAL_MS');
  }

  get realtimeEnabled(): boolean {
    return this.get('REALTIME_ENABLED');
  }

  get ffmpegPath(): string | undefined {
    const path = this.get('FFMPEG_PATH');
    return path && path.length > 0 ? path : undefined;
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

  get defaultCountryCode(): string {
    return this.get('DEFAULT_COUNTRY_CODE');
  }
}
