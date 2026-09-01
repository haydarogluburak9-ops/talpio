'use client';

import { ApiError } from '@talpio/api-client';
import { minorUnitFactor, queryKeys } from '@talpio/config';
import { FilePurpose, RequestOfferStatus, type RequestOffer } from '@talpio/types';
import { Button, Field, Input, Textarea } from '@talpio/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { CurrencySelect } from '@/features/currency/currency-select';
import { useMyCurrency } from '@/features/currency/use-currency';
import { PhotoUploader } from '@/features/files/photo-uploader';
import { useCreateRequestOffer, useMyBusinesses } from '@/features/requests/use-requests';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

import { OfferDocument } from './offer-document';

const VALIDITY_DAYS = [3, 7, 14] as const;
const NOTE_MIN = 10;

export type OfferFormRequest = {
  title: string;
  description?: string | null;
  quantity?: string | null;
  unit?: string | null;
  deliveryAddressText?: string | null;
};

export function OfferForm({
  requestId,
  businessId,
  request,
}: {
  requestId: string;
  businessId: string;
  request?: OfferFormRequest;
}) {
  const create = useCreateRequestOffer(requestId);
  const businesses = useMyBusinesses();
  const localeSettings = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'locale', businessId],
    queryFn: ({ signal }) => apiClient.businesses.getLocaleSettings(businessId, signal),
    enabled: Boolean(businessId),
  });
  const store = (businesses.data as Array<{ id: string; name: string }> | undefined)?.find(
    (row) => row.id === businessId,
  );
  const defaultCurrency = useMyCurrency();
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const currency = currencyOverride ?? defaultCurrency;
  const [amount, setAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [note, setNote] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [locationText, setLocationText] = useState(request?.deliveryAddressText ?? '');
  const [shippingIncluded, setShippingIncluded] = useState<boolean | null>(null);
  const [validityDays, setValidityDays] = useState<(typeof VALIDITY_DAYS)[number]>(7);
  const [legalName, setLegalName] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [stampUrl, setStampUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [stampUploading, setStampUploading] = useState(false);
  const [photoFileIds, setPhotoFileIds] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Array<{ id: string; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const loadedSettings = localeSettings.data;
  const [letterheadSynced, setLetterheadSynced] = useState(false);
  if (loadedSettings && !letterheadSynced) {
    setLetterheadSynced(true);
    setLegalName((value) => value || loadedSettings.legalName || store?.name || '');
    setInvoiceTitle((value) => value || loadedSettings.invoiceTitle || '');
    setTaxOffice((value) => value || loadedSettings.taxOffice || '');
    setTaxId((value) => value || loadedSettings.taxId || '');
    setAddress((value) => value || loadedSettings.address || '');
    setPhone((value) => value || loadedSettings.phone || '');
    setLogoUrl((value) => value || loadedSettings.logoUrl || '');
    setStampUrl((value) => value || loadedSettings.stampUrl || '');
  }
  if (store?.name && !legalName) {
    setLegalName(store.name);
  }

  async function onAsset(file: File | undefined, setter: (url: string) => void, busy: (on: boolean) => void) {
    if (!file) return;
    busy(true);
    setError(null);
    try {
      const uploaded = await apiClient.files.upload(file, FilePurpose.AVATAR);
      setter(uploaded.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('offer.submitFailed'));
    } finally {
      busy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const amountMinor = Math.round(Number(amount.replace(',', '.')) * minorUnitFactor(currency));
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      setError(t('offer.invalidAmount'));
      return;
    }

    const days = Number(deliveryDays.trim().replace(',', '.'));
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setError(t('offer.deliveryRequired'));
      return;
    }

    if (!brand.trim()) {
      setError(t('offer.brandRequired'));
      return;
    }
    if (!model.trim()) {
      setError(t('offer.modelRequired'));
      return;
    }
    if (note.trim().length < NOTE_MIN) {
      setError(t('offer.contentsRequired'));
      return;
    }
    if (!legalName.trim()) {
      setError(t('offer.legalNameRequired'));
      return;
    }
    if (!locationText.trim()) {
      setError(t('social.locationRequired'));
      return;
    }
    if (shippingIncluded == null) {
      setError(t('social.shippingRequired'));
      return;
    }

    try {
      await create.mutateAsync({
        businessId,
        amountMinor,
        currency,
        deliveryDays: days,
        locationText: locationText.trim(),
        shippingIncluded,
        note: note.trim(),
        brand: brand.trim(),
        model: model.trim(),
        letterhead: {
          legalName: legalName.trim(),
          ...(invoiceTitle.trim() ? { invoiceTitle: invoiceTitle.trim() } : {}),
          ...(taxOffice.trim() ? { taxOffice: taxOffice.trim() } : {}),
          ...(taxId.trim() ? { taxId: taxId.trim() } : {}),
          ...(address.trim() ? { address: address.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
          ...(stampUrl.trim() ? { stampUrl: stampUrl.trim() } : {}),
        },
        ...(photoFileIds.length > 0 ? { attachmentFileIds: photoFileIds } : {}),
        validUntil: new Date(Date.now() + validityDays * 86_400_000).toISOString(),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('offer.submitFailed'));
    }
  }

  const qty =
    request?.quantity != null && request.quantity.trim()
      ? `${request.quantity}${request.unit ? ` ${request.unit}` : ''}`
      : null;

  const draft = draftOffer({
    requestId,
    businessId,
    amount,
    currency,
    deliveryDays,
    note,
    brand,
    model,
    locationText,
    shippingIncluded,
    validityDays,
    legalName: legalName || store?.name || '',
    invoiceTitle,
    taxOffice,
    taxId,
    address,
    phone,
    logoUrl,
    stampUrl,
    sellerName: store?.name ?? legalName,
    photos: photoUrls,
  });

  if (sent) {
    return <p className="text-sm text-foreground-muted">{t('offer.submitted')}</p>;
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-5">
      <p className="text-sm text-foreground-muted">{t('offer.formHint')}</p>

      {request ? (
        <div className="rounded-xl bg-surface-muted/70 px-4 py-3 ring-1 ring-border/70">
          <p className="text-xs font-medium text-foreground-muted">{t('offer.forRequest')}</p>
          <p className="mt-0.5 font-semibold text-foreground">{request.title}</p>
          {qty ? (
            <p className="mt-1 text-sm text-foreground">
              {t('commerce.fieldQuantity')}: {qty}
            </p>
          ) : null}
          {request.description ? (
            <p className="mt-1 line-clamp-3 text-sm text-foreground-muted">{request.description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('offer.brand')} required>
          {(props) => (
            <Input
              {...props}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('offer.brandPlaceholder')}
              required
            />
          )}
        </Field>
        <Field label={t('offer.model')} required>
          {(props) => (
            <Input
              {...props}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t('offer.modelPlaceholder')}
              required
            />
          )}
        </Field>

        <Field
          label={t('offer.contents')}
          required
          hint={t('offer.contentsHint')}
          className="sm:col-span-2"
        >
          {(props) => (
            <Textarea
              {...props}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('offer.contentsPlaceholder')}
              rows={4}
              required
              minLength={NOTE_MIN}
            />
          )}
        </Field>

        <Field
          label={t('offer.photosLabel')}
          hint={t('offer.photosHint')}
          className="sm:col-span-2"
        >
          {() => (
            <PhotoUploader
              value={photoFileIds}
              onChange={setPhotoFileIds}
              onItemsChange={(items) =>
                setPhotoUrls(items.map((file) => ({ id: file.id, url: file.url })))
              }
            />
          )}
        </Field>

        <Field label={t('offer.amount')} required hint={t('offer.amountHint')}>
          {(props) => (
            <Input
              {...props}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              required
            />
          )}
        </Field>

        <Field label={t('currency.label')}>
          {(props) => (
            <CurrencySelect id={props.id} value={currency} onChange={setCurrencyOverride} />
          )}
        </Field>

        <Field label={t('offer.deliveryDays')} required>
          {(props) => (
            <Input
              {...props}
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              inputMode="numeric"
              placeholder={t('offer.deliveryDaysPlaceholder')}
              required
            />
          )}
        </Field>

        <Field label={t('offer.validityDays')} required>
          {(props) => (
            <div id={props.id} className="flex flex-wrap gap-2">
              {VALIDITY_DAYS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setValidityDays(days)}
                  className={
                    validityDays === days
                      ? 'rounded-xl bg-brand-900 px-3 py-2 text-sm font-medium text-white'
                      : 'rounded-xl bg-surface-muted px-3 py-2 text-sm font-medium text-foreground-muted'
                  }
                >
                  {t('offer.validityDaysValue', { count: days })}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label={t('social.dealLocation')} required className="sm:col-span-2">
          {(props) => (
            <Input
              {...props}
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder={t('social.dealLocationPlaceholder')}
              required
            />
          )}
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">{t('social.shippingIncluded')}</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShippingIncluded(true)}
              className={
                shippingIncluded === true
                  ? 'rounded-xl bg-brand-900 px-3 py-2 text-sm font-medium text-white'
                  : 'rounded-xl bg-surface-muted px-3 py-2 text-sm font-medium text-foreground-muted'
              }
            >
              {t('social.shippingIncludedYes')}
            </button>
            <button
              type="button"
              onClick={() => setShippingIncluded(false)}
              className={
                shippingIncluded === false
                  ? 'rounded-xl bg-brand-900 px-3 py-2 text-sm font-medium text-white'
                  : 'rounded-xl bg-surface-muted px-3 py-2 text-sm font-medium text-foreground-muted'
              }
            >
              {t('social.shippingIncludedNo')}
            </button>
          </div>
        </fieldset>
      </div>

      <section className="grid gap-3 rounded-xl bg-surface-muted/50 p-4 ring-1 ring-border/70 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">{t('offer.letterheadTitle')}</h3>
          <p className="mt-0.5 text-xs text-foreground-muted">{t('profile.letterheadHint')}</p>
        </div>
        <Field label={t('offer.legalName')} required>
          {(props) => (
            <Input {...props} value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
          )}
        </Field>
        <Field label={t('offer.invoiceTitle')}>
          {(props) => (
            <Input {...props} value={invoiceTitle} onChange={(e) => setInvoiceTitle(e.target.value)} />
          )}
        </Field>
        <Field label={t('offer.taxOffice')}>
          {(props) => (
            <Input {...props} value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} />
          )}
        </Field>
        <Field label={t('currency.taxIdLabel')}>
          {(props) => <Input {...props} value={taxId} onChange={(e) => setTaxId(e.target.value)} />}
        </Field>
        <Field label={t('offer.address')} className="sm:col-span-2">
          {(props) => (
            <Input {...props} value={address} onChange={(e) => setAddress(e.target.value)} />
          )}
        </Field>
        <Field label={t('offer.phone')}>
          {(props) => <Input {...props} value={phone} onChange={(e) => setPhone(e.target.value)} />}
        </Field>
        <Field label={t('offer.logo')} hint={t('offer.logoHint')}>
          {(props) => (
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-12 w-12 rounded-md object-contain ring-1 ring-border" />
              ) : null}
              <label className="cursor-pointer text-sm font-medium text-accent-600 hover:underline">
                {logoUploading ? t('common.loading') : t('offer.logoUpload')}
                <input
                  {...props}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={logoUploading}
                  onChange={(e) => void onAsset(e.target.files?.[0], setLogoUrl, setLogoUploading)}
                />
              </label>
            </div>
          )}
        </Field>
        <Field label={t('profile.stamp')} hint={t('profile.stampHint')}>
          {(props) => (
            <div className="flex items-center gap-3">
              {stampUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={stampUrl} alt="" className="h-12 w-12 rounded-md object-contain ring-1 ring-border" />
              ) : null}
              <label className="cursor-pointer text-sm font-medium text-accent-600 hover:underline">
                {stampUploading ? t('common.loading') : t('profile.stampUpload')}
                <input
                  {...props}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={stampUploading}
                  onChange={(e) => void onAsset(e.target.files?.[0], setStampUrl, setStampUploading)}
                />
              </label>
            </div>
          )}
        </Field>
      </section>

      <section className="overflow-hidden rounded-xl ring-1 ring-border">
        <p className="bg-surface-muted px-4 py-2 text-xs font-semibold tracking-wide text-foreground-muted uppercase">
          {t('offer.previewTitle')}
        </p>
        <div className="p-4">
          <OfferDocument
            offer={draft}
            request={request ? { title: request.title, quantity: request.quantity, unit: request.unit } : null}
          />
        </div>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-danger-500">
          {error}
        </p>
      ) : null}

      <div>
        <Button
          type="submit"
          className="bg-accent-500 text-white hover:bg-accent-600"
          disabled={create.isPending || logoUploading || stampUploading}
        >
          {create.isPending ? t('offer.submitting') : t('offer.submit')}
        </Button>
      </div>
    </form>
  );
}

function draftOffer(input: {
  requestId: string;
  businessId: string;
  amount: string;
  currency: string;
  deliveryDays: string;
  note: string;
  brand: string;
  model: string;
  locationText: string;
  shippingIncluded: boolean | null;
  validityDays: number;
  legalName: string;
  invoiceTitle: string;
  taxOffice: string;
  taxId: string;
  address: string;
  phone: string;
  logoUrl: string;
  stampUrl: string;
  sellerName: string;
  photos: Array<{ id: string; url: string }>;
}): RequestOffer {
  const amountMinor = Math.max(
    0,
    Math.round(Number(input.amount.replace(',', '.')) * minorUnitFactor(input.currency)) || 0,
  );
  const days = Number(input.deliveryDays.trim().replace(',', '.'));
  const now = new Date().toISOString();

  return {
    id: 'preview',
    requestId: input.requestId,
    businessId: input.businessId,
    createdByUserId: 'preview',
    status: RequestOfferStatus.SUBMITTED,
    amountMinor,
    currency: input.currency,
    deliveryDays: Number.isInteger(days) && days > 0 ? days : null,
    shippingIncluded: input.shippingIncluded,
    locationText: input.locationText.trim() || null,
    note: input.note.trim() || null,
    brand: input.brand.trim() || null,
    model: input.model.trim() || null,
    letterhead: {
      legalName: input.legalName.trim() || null,
      invoiceTitle: input.invoiceTitle.trim() || null,
      taxOffice: input.taxOffice.trim() || null,
      taxId: input.taxId.trim() || null,
      address: input.address.trim() || null,
      phone: input.phone.trim() || null,
      logoUrl: input.logoUrl.trim() || null,
      stampUrl: input.stampUrl.trim() || null,
    },
    validUntil: new Date(Date.now() + input.validityDays * 86_400_000).toISOString(),
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    seller: {
      businessId: input.businessId,
      name: input.sellerName || input.legalName,
      isVerified: false,
    },
    photos: input.photos,
  };
}
