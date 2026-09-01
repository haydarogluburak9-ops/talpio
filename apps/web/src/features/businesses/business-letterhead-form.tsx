'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import { FilePurpose } from '@talpio/types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  ListSkeleton,
} from '@talpio/ui';
import { useState } from 'react';

import { useMyBusinesses } from '@/features/requests/use-requests';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

type LetterheadDraft = {
  legalName: string;
  invoiceTitle: string;
  taxOffice: string;
  taxId: string;
  address: string;
  phone: string;
  logoUrl: string;
  stampUrl: string;
};

const EMPTY: LetterheadDraft = {
  legalName: '',
  invoiceTitle: '',
  taxOffice: '',
  taxId: '',
  address: '',
  phone: '',
  logoUrl: '',
  stampUrl: '',
};

/**
 * Firma cari / antet formu.
 *
 * Logo ve kaşe bir kez yüklenir; teklif formu ve PDF bu kayıttan dolar.
 * Para birimi ayrı tutulur — o mağaza fiyatlandırmasına aittir, antete değil.
 */
export function BusinessLetterheadForm() {
  const businesses = useMyBusinesses();
  const list =
    (businesses.data as Array<{ id: string; name: string }> | undefined) ?? [];
  const [businessId, setBusinessId] = useState('');
  const selected = list.find((row) => row.id === businessId) ?? list[0];

  if (businesses.isPending) return <ListSkeleton rows={3} />;
  if (!selected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.letterheadSection')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted">{t('profile.noBusiness')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <LetterheadEditor
      businessId={selected.id}
      businessName={selected.name}
      businesses={list}
      onSelectBusiness={setBusinessId}
    />
  );
}

function LetterheadEditor({
  businessId,
  businessName,
  businesses,
  onSelectBusiness,
}: {
  businessId: string;
  businessName: string;
  businesses: Array<{ id: string; name: string }>;
  onSelectBusiness: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'locale', businessId],
    queryFn: ({ signal }) => apiClient.businesses.getLocaleSettings(businessId, signal),
  });
  const [draft, setDraft] = useState<LetterheadDraft>(EMPTY);
  const [logoUploading, setLogoUploading] = useState(false);
  const [stampUploading, setStampUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loaded = settings.data;
  const [syncedFrom, setSyncedFrom] = useState(loaded);
  if (loaded && loaded !== syncedFrom) {
    setSyncedFrom(loaded);
    setDraft({
      legalName: loaded.legalName ?? businessName,
      invoiceTitle: loaded.invoiceTitle ?? '',
      taxOffice: loaded.taxOffice ?? '',
      taxId: loaded.taxId ?? '',
      address: loaded.address ?? '',
      phone: loaded.phone ?? '',
      logoUrl: loaded.logoUrl ?? '',
      stampUrl: loaded.stampUrl ?? '',
    });
  }

  const save = useMutation({
    mutationFn: () =>
      apiClient.businesses.updateLocaleSettings(businessId, {
        legalName: draft.legalName.trim() || null,
        invoiceTitle: draft.invoiceTitle.trim() || null,
        taxOffice: draft.taxOffice.trim() || null,
        taxId: draft.taxId.trim() || null,
        address: draft.address.trim() || null,
        phone: draft.phone.trim() || null,
        logoUrl: draft.logoUrl.trim() || null,
        stampUrl: draft.stampUrl.trim() || null,
      }),
    onSuccess: (saved) => {
      setSyncedFrom(saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all() });
    },
  });

  async function upload(file: File | undefined, field: 'logoUrl' | 'stampUrl') {
    if (!file) return;
    setError(null);
    if (field === 'logoUrl') setLogoUploading(true);
    else setStampUploading(true);
    try {
      const uploaded = await apiClient.files.upload(file, FilePurpose.AVATAR);
      setDraft((current) => ({ ...current, [field]: uploaded.url }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profile.saveFailed'));
    } finally {
      setLogoUploading(false);
      setStampUploading(false);
    }
  }

  function setField<K extends keyof LetterheadDraft>(key: K, value: LetterheadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.letterheadSection')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <p className="text-sm text-foreground-muted">{t('profile.letterheadHint')}</p>

          {businesses.length > 1 ? (
            <Field label={t('profile.letterheadBusiness')}>
              {(props) => (
                <select
                  {...props}
                  value={businessId}
                  onChange={(e) => onSelectBusiness(e.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-2"
                >
                  {businesses.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ) : null}

          {settings.isPending ? <ListSkeleton rows={3} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('offer.legalName')} required>
              {(props) => (
                <Input
                  {...props}
                  value={draft.legalName}
                  onChange={(e) => setField('legalName', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('offer.invoiceTitle')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.invoiceTitle}
                  onChange={(e) => setField('invoiceTitle', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('offer.taxOffice')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.taxOffice}
                  onChange={(e) => setField('taxOffice', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('currency.taxIdLabel')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.taxId}
                  onChange={(e) => setField('taxId', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('offer.address')} className="sm:col-span-2">
              {(props) => (
                <Input
                  {...props}
                  value={draft.address}
                  onChange={(e) => setField('address', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('offer.phone')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              label={t('offer.logo')}
              hint={t('offer.logoHint')}
              url={draft.logoUrl}
              uploading={logoUploading}
              uploadLabel={t('offer.logoUpload')}
              onFile={(file) => void upload(file, 'logoUrl')}
              onClear={() => setField('logoUrl', '')}
            />
            <ImageUploadField
              label={t('profile.stamp')}
              hint={t('profile.stampHint')}
              url={draft.stampUrl}
              uploading={stampUploading}
              uploadLabel={t('profile.stampUpload')}
              onFile={(file) => void upload(file, 'stampUrl')}
              onClear={() => setField('stampUrl', '')}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-danger-500">
              {error}
            </p>
          ) : null}
          {save.isSuccess ? (
            <p className="text-sm text-foreground-muted">{t('profile.saved')}</p>
          ) : null}

          <div>
            <Button
              type="submit"
              disabled={save.isPending || logoUploading || stampUploading}
              className="bg-accent-500 text-white hover:bg-accent-600"
            >
              {save.isPending ? t('profile.saving') : t('profile.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function ImageUploadField({
  label,
  hint,
  url,
  uploading,
  uploadLabel,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  url: string;
  uploading: boolean;
  uploadLabel: string;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <Field label={label} hint={hint}>
      {(props) => (
        <div className="flex items-center gap-3">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-16 w-16 rounded-md object-contain ring-1 ring-border" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-md bg-surface-muted text-[10px] text-foreground-muted">
              —
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="cursor-pointer text-sm font-medium text-accent-600 hover:underline">
              {uploading ? t('common.loading') : uploadLabel}
              <input
                {...props}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {url ? (
              <button
                type="button"
                className="text-left text-xs text-foreground-muted hover:underline"
                onClick={onClear}
              >
                {t('upload.remove')}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </Field>
  );
}
