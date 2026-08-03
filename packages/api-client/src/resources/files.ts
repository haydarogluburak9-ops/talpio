import { API_ROUTES } from '@ustapilot/config';
import type { FileAsset, FilePurpose } from '@ustapilot/types';

import type { HttpClient, UploadFile } from '../http-client';

export function createFilesResource(http: HttpClient) {
  return {
    /**
     * Dosyayı yükler ve üst verisini döner.
     *
     * Dönen kimlik, talep veya mesaj oluşturulurken `attachmentFileIds` içine
     * konur; yükleme tek başına hiçbir kayda bağlanmaz.
     */
    upload(file: UploadFile, purpose: FilePurpose): Promise<FileAsset> {
      return http.upload<FileAsset>(API_ROUTES.files.upload, file, { purpose });
    },

    getById(id: string, signal?: AbortSignal): Promise<FileAsset> {
      return http.get<FileAsset>(API_ROUTES.files.byId(id), {
        ...(signal ? { signal } : {}),
      });
    },

    /** Yalnızca henüz bir kayda bağlanmamış dosyalar silinebilir. */
    remove(id: string): Promise<void> {
      return http.delete<void>(API_ROUTES.files.byId(id));
    },
  };
}

export type FilesResource = ReturnType<typeof createFilesResource>;
