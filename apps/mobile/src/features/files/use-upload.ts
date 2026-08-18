import { useState } from 'react';

import { UPLOAD } from '@talpio/config';
import { FilePurpose, type FileAsset } from '@talpio/types';

import { apiClient } from '@/lib/api';

/** `expo-image-picker` varlığından ihtiyaç duyulan alanlar. */
export interface PickedAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

/**
 * Seçilen görselleri yükler.
 *
 * Yükleme seçim anında başlar; kullanıcı sihirbazın kalan adımlarını
 * doldururken tamamlanır ve gönderim anında beklemek gerekmez.
 */
export function usePhotoUpload(purpose: FilePurpose = FilePurpose.JOB_PHOTO) {
  const [items, setItems] = useState<FileAsset[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [hasFailure, setHasFailure] = useState(false);

  /** Yüklenen dosyaları döner; durum güncellemesi beklenmeden kullanılabilsin diye. */
  async function add(
    assets: PickedAsset[],
    max: number = UPLOAD.maxJobAttachments,
  ): Promise<FileAsset[]> {
    const room = max - items.length - pendingCount;
    const accepted = assets.slice(0, Math.max(room, 0));
    if (accepted.length === 0) return [];

    setHasFailure(false);
    setPendingCount((count) => count + accepted.length);

    // Yüklemeler tek tek beklenmez; birinin başarısız olması diğerlerini
    // iptal etmemeli, bu yüzden sonuçlar ayrı ayrı değerlendirilir.
    const results = await Promise.allSettled(accepted.map((asset) => uploadAsset(asset, purpose)));

    const uploaded = results
      .filter((result): result is PromiseFulfilledResult<FileAsset> => result.status === 'fulfilled')
      .map((result) => result.value);

    setPendingCount((count) => count - accepted.length);
    setItems((current) => [...current, ...uploaded]);
    if (uploaded.length < accepted.length) setHasFailure(true);

    return uploaded;
  }

  function remove(fileId: string): void {
    setItems((current) => current.filter((file) => file.id !== fileId));
    // Sunucudaki kaydın silinmesi beklenmez: henüz hiçbir talebe bağlı olmadığı
    // için artakalan dosya tutarsızlık üretmez ve kullanıcı beklemez.
    void apiClient.files.remove(fileId).catch(() => undefined);
  }

  return {
    items,
    fileIds: items.map((file) => file.id),
    isUploading: pendingCount > 0,
    hasFailure,
    add,
    remove,
  };
}

/**
 * Yerel dosyayı yükler.
 *
 * İçerik belleğe okunmaz: React Native `FormData`'ya verilen dosya
 * tanımlayıcısını doğrudan akıtır, böylece büyük fotoğraflar bellek şişirmez.
 */
function uploadAsset(asset: PickedAsset, purpose: FilePurpose): Promise<FileAsset> {
  // Seçici bazı platformlarda tür bildirmez; kamera çıktısı JPEG olduğu için
  // varsayılan odur ve sunucu türü ayrıca doğrular.
  const type = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `photo.${type.split('/')[1] ?? 'jpg'}`;

  return apiClient.files.upload({ uri: asset.uri, name, type }, purpose);
}
