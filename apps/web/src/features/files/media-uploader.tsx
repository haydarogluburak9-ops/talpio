'use client';

import { UPLOAD } from '@talpio/config';
import { FilePurpose, type FileAsset } from '@talpio/types';
import { Button } from '@talpio/ui';
import { useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

export interface MediaUploaderProps {
  value: string[];
  onChange: (fileIds: string[]) => void;
  assets?: FileAsset[];
  onAssetsChange?: (assets: FileAsset[]) => void;
  purpose?: FilePurpose;
  max?: number;
}

/** Akış için fotoğraf + video yükleyici. */
export function MediaUploader({
  value,
  onChange,
  assets: controlledAssets,
  onAssetsChange,
  purpose = FilePurpose.POST_MEDIA,
  max = UPLOAD.maxPostMedia,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localAssets, setLocalAssets] = useState<FileAsset[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const items = controlledAssets ?? localAssets;
  const setItems = (next: FileAsset[] | ((current: FileAsset[]) => FileAsset[])) => {
    const resolved = typeof next === 'function' ? next(items) : next;
    if (onAssetsChange) onAssetsChange(resolved);
    else setLocalAssets(resolved);
  };

  const remaining = max - value.length - pendingCount;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const selected = [...files];
    if (selected.length > remaining) {
      setError(t('upload.tooMany', { count: max }));
      return;
    }

    setPendingCount((count) => count + selected.length);
    const results = await Promise.allSettled(
      selected.map((file) => apiClient.files.upload(file, purpose)),
    );
    const uploaded = results
      .filter((result): result is PromiseFulfilledResult<FileAsset> => result.status === 'fulfilled')
      .map((result) => result.value);

    setPendingCount((count) => count - selected.length);
    setItems((current) => [...current, ...uploaded]);
    onChange([...value, ...uploaded.map((file) => file.id)]);
    if (uploaded.length < selected.length) setError(t('upload.failed'));
  }

  function remove(fileId: string) {
    setItems((current) => current.filter((file) => file.id !== fileId));
    onChange(value.filter((id) => id !== fileId));
    void apiClient.files.remove(fileId).catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD.allowedPostMediaMimeTypes.join(',')}
        multiple
        className="sr-only"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {items.map((file) => (
            <li key={file.id} className="relative">
              {file.mimeType.startsWith('video/') ? (
                <video
                  src={file.url}
                  className="size-24 rounded-[--radius-control] border border-border object-cover"
                  muted
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt=""
                  className="size-24 rounded-[--radius-control] border border-border object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => remove(file.id)}
                aria-label={t('upload.remove')}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-danger-surface text-sm font-bold text-danger-on-surface"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={remaining <= 0 || pendingCount > 0}
          onClick={() => inputRef.current?.click()}
        >
          {pendingCount > 0 ? t('upload.uploading') : t('social.addMedia')}
        </Button>
        <span className="text-xs text-foreground-muted">
          {value.length}/{max} · {t('social.mediaHint')}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger-on-surface">
          {error}
        </p>
      ) : null}
    </div>
  );
}
