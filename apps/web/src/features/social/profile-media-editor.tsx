'use client';

import { UPLOAD, SOCIAL } from '@talpio/config';
import { FilePurpose } from '@talpio/types';
import { cn } from '@talpio/ui';
import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

import { useUpdateSocialProfile } from './use-social';

export function ProfileCoverEditor({
  coverUrl,
  disabled,
}: {
  coverUrl: string | null | undefined;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateSocialProfile();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shown = preview ?? coverUrl ?? null;
  const busy = update.isPending;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));

    try {
      const uploaded = await apiClient.files.upload(file, FilePurpose.COVER);
      await update.mutateAsync({ coverFileId: uploaded.id });
      setPreview(uploaded.url);
    } catch {
      setPreview(null);
      setError(t('upload.failed'));
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD.allowedImageMimeTypes.join(',')}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="size-full object-cover object-center" />
      ) : (
        <div
          className="size-full bg-gradient-to-br from-brand-900 via-brand-700 to-accent-500"
          aria-hidden
        />
      )}

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70',
          busy && 'opacity-70',
        )}
        aria-label={t('social.changeCover')}
      >
        <Camera className="size-3.5" aria-hidden />
        {busy ? t('upload.uploading') : t('social.changeCover')}
      </button>

      <p className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
        {t('social.coverSizeHint', {
          width: SOCIAL.recommendedCoverWidth,
          height: SOCIAL.recommendedCoverHeight,
        })}
      </p>

      {error ? (
        <p role="alert" className="absolute inset-x-3 bottom-14 rounded-lg bg-danger-surface px-3 py-2 text-xs text-danger-on-surface">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function ProfileAvatarEditor({
  name,
  avatarUrl,
  disabled,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateSocialProfile();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shown = preview ?? avatarUrl ?? null;
  const busy = update.isPending;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));

    try {
      const uploaded = await apiClient.files.upload(file, FilePurpose.AVATAR);
      await update.mutateAsync({ avatarFileId: uploaded.id });
      setPreview(uploaded.url);
    } catch {
      setPreview(null);
      setError(t('upload.failed'));
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD.allowedImageMimeTypes.join(',')}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt=""
          className="size-20 shrink-0 rounded-2xl object-cover ring-4 ring-surface sm:size-24"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-20 shrink-0 place-items-center rounded-2xl bg-accent-500 font-display text-2xl font-bold text-white ring-4 ring-surface sm:size-24"
        >
          {name.slice(0, 1).toLocaleUpperCase()}
        </span>
      )}

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-surface bg-brand-900 text-white shadow-sm transition hover:bg-brand-800',
          busy && 'opacity-70',
        )}
        aria-label={t('social.changeProfilePhoto')}
        title={t('social.changeProfilePhoto')}
      >
        <Camera className="size-4" aria-hidden />
      </button>

      {error ? (
        <p role="alert" className="absolute left-0 top-full mt-1 max-w-[12rem] text-xs text-danger-on-surface">
          {error}
        </p>
      ) : null}
    </div>
  );
}
