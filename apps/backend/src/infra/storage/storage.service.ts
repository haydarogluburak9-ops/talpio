import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';

export interface StoredObject {
  storageKey: string;
  /** Herkese açık nesnelerde doğrudan erişim adresi; gizli nesnelerde `null`. */
  url: string | null;
}

/** İmzalı bağlantı ömrü. Gizli belgelerin bağlantısı paylaşılamayacak kadar kısa yaşar. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Nesne deposu (MinIO/S3) erişimi.
 *
 * Uygulama kodu kova adını ve istemci kurulumunu bilmez; yalnızca mantıksal bir
 * klasör adı ve dosya içeriği verir.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: AppConfigService) {
    const storage = this.config.storage;

    this.bucket = storage.bucket;
    this.publicBaseUrl = this.config.fileBaseUrl;

    this.client = new S3Client({
      region: storage.region,
      endpoint: storage.endpoint,
      forcePathStyle: storage.forcePathStyle,
      credentials: { accessKeyId: storage.accessKey, secretAccessKey: storage.secretKey },
    });
  }

  /**
   * Dosyayı yükler ve depo anahtarını döner.
   *
   * Anahtar sunucuda üretilir: istemciden gelen ad yol geçişi (`../`) içerebilir
   * ve aynı adlı iki yükleme birbirini ezerdi.
   */
  async upload(input: {
    folder: string;
    body: Buffer;
    mimeType: string;
    originalName?: string;
    isPublic: boolean;
  }): Promise<StoredObject> {
    const storageKey = buildKey(input.folder, input.originalName);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: input.body,
        ContentType: input.mimeType,
        ContentLength: input.body.byteLength,
      }),
    );

    return {
      storageKey,
      url: input.isPublic ? `${this.publicBaseUrl}/${storageKey}` : null,
    };
  }

  /** Gizli nesneler için süreli erişim bağlantısı üretir. */
  signedUrl(storageKey: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn: SIGNED_URL_TTL_SECONDS },
    );
  }

  publicUrl(storageKey: string): string {
    return `${this.publicBaseUrl}/${storageKey}`;
  }

  /**
   * Nesneyi depodan siler.
   *
   * Silme hatası çağıranı durdurmaz: veritabanı kaydı zaten kaldırıldığı için
   * artakalan nesne yalnızca yer kaplar, tutarsızlık üretmez.
   */
  async remove(storageKey: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Nesne silinemedi (${storageKey}): ${message}`);
    }
  }
}

/** Çakışmayan, tahmin edilemeyen depo anahtarı. Uzantı yalnızca okunabilirlik içindir. */
function buildKey(folder: string, originalName?: string): string {
  const extension = originalName ? extname(originalName).toLowerCase().slice(0, 10) : '';
  const safeExtension = /^\.[a-z0-9]+$/.test(extension) ? extension : '';

  return `${folder}/${randomUUID()}${safeExtension}`;
}
