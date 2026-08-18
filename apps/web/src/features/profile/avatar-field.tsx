'use client';

import { UPLOAD } from '@talpio/config';
import { FilePurpose } from '@talpio/types';
import { Button } from '@talpio/ui';
import { useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
import { localeTag, t } from '@/lib/i18n';

export interface AvatarFieldProps {
  /** Gösterilecek adres. Henüz yükleme yapılmadıysa sunucudan gelen görsel. */
  currentUrl: string | null;
  displayName: string;
  onUploaded: (fileId: string) => void;
  onRemoved: () => void;
  disabled?: boolean;
}

/**
 * Profil görseli alanı.
 *
 * Seçilen dosya hemen yüklenir ve yalnızca kimliği forma yazılır; kaydetmeden
 * önce önizleme göstermek için yerel adres kullanılır, böylece kullanıcı
 * sonucu görmek için kaydete basmak zorunda kalmaz.
 */
export function AvatarField({
  currentUrl,
  displayName,
  onUploaded,
  onRemoved,
  disabled,
}: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = preview ?? currentUrl;

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const uploaded = await apiClient.files.upload(file, FilePurpose.AVATAR);
      setPreview(uploaded.url);
      onUploaded(uploaded.id);
    } catch {
      setError(t('upload.failed'));
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    setPreview(null);
    onRemoved();
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD.allowedImageMimeTypes.join(',')}
        className="sr-only"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          // Aynı dosya art arda seçilebilsin diye alan sıfırlanır.
          event.target.value = '';
        }}
      />

      <div className="flex items-center gap-4">
        {shown ? (
          // Görseller nesne deposundan gelir; Next optimizasyonu ayrı yapılandırma
          // gerektirdiğinden düz `img` kullanılır.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            className="size-20 rounded-full border border-border object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-20 items-center justify-center rounded-full bg-brand-50 text-2xl font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-100"
          >
            {displayName.trim().charAt(0).toLocaleUpperCase(localeTag())}
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? t('upload.uploading') : t('profile.changeAvatar')}
          </Button>
          {shown ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={remove}
            >
              {t('profile.removeAvatar')}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger-on-surface">
          {error}
        </p>
      ) : null}
    </div>
  );
}
