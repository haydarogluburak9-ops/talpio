import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { StorageService } from '@infra/storage/storage.service';

const execFileAsync = promisify(execFile);

export interface FileAssetMetadata {
  width?: number;
  height?: number;
  thumbStorageKey?: string;
  processedAt?: string;
  originalSizeBytes?: number;
}

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: AppConfigService,
  ) {}

  async processPostMedia(fileId: string): Promise<void> {
    const file = await this.prisma.fileAsset.findFirst({
      where: { id: fileId, deletedAt: null },
    });
    if (!file) return;

    const existing = (file.metadata ?? {}) as FileAssetMetadata;
    if (existing.processedAt) return;

    if (file.mimeType.startsWith('image/')) {
      await this.processImage(file.id, file.storageKey, file.sizeBytes);
      return;
    }

    if (file.mimeType.startsWith('video/')) {
      await this.processVideo(file.id, file.storageKey, file.sizeBytes);
    }
  }

  private async processImage(
    fileId: string,
    storageKey: string,
    sizeBytes: number,
  ): Promise<void> {
    const object = await this.storage.downloadBuffer(storageKey);
    const pipeline = sharp(object, { failOn: 'none' });
    const meta = await pipeline.metadata();

    const compressed = await sharp(object, { failOn: 'none' })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    if (compressed.byteLength < sizeBytes) {
      await this.storage.replaceObject(storageKey, compressed, 'image/webp');
    }

    const thumbKey = storageKey.replace(/(\.[^./]+)?$/, '-thumb.webp');
    const thumb = await sharp(object, { failOn: 'none' })
      .rotate()
      .resize({ width: 480, height: 480, fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer();

    await this.storage.uploadRaw(thumbKey, thumb, 'image/webp');

    await this.prisma.fileAsset.update({
      where: { id: fileId },
      data: {
        sizeBytes: compressed.byteLength,
        mimeType: 'image/webp',
        metadata: {
          width: meta.width,
          height: meta.height,
          thumbStorageKey: thumbKey,
          processedAt: new Date().toISOString(),
          originalSizeBytes: sizeBytes,
        },
      },
    });
  }

  private async processVideo(fileId: string, storageKey: string, sizeBytes: number): Promise<void> {
    const ffmpeg = this.config.ffmpegPath;
    const metadata: FileAssetMetadata = {
      processedAt: new Date().toISOString(),
      originalSizeBytes: sizeBytes,
    };

    if (ffmpeg) {
      try {
        const source = await this.storage.downloadToTemp(storageKey);
        const thumbPath = `${source}.thumb.jpg`;
        await execFileAsync(ffmpeg, [
          '-y',
          '-i',
          source,
          '-ss',
          '00:00:01',
          '-vframes',
          '1',
          '-q:v',
          '3',
          thumbPath,
        ]);
        const thumbBuffer = await readFile(thumbPath).then((buf) =>
          sharp(buf).webp({ quality: 78 }).toBuffer(),
        );
        const thumbKey = storageKey.replace(/(\.[^./]+)?$/, '-thumb.webp');
        await this.storage.uploadRaw(thumbKey, thumbBuffer, 'image/webp');
        metadata.thumbStorageKey = thumbKey;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Video küçük resmi üretilemedi (${fileId}): ${msg}`);
      }
    }

    await this.prisma.fileAsset.update({
      where: { id: fileId },
      data: { metadata: metadata as object },
    });
  }
}
