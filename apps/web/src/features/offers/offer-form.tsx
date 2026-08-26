'use client';

import { ApiError } from '@talpio/api-client';
import { DEFAULT_CURRENCY } from '@talpio/config';
import { Button, Field, Input, Textarea } from '@talpio/ui';
import { useState } from 'react';

import { useCreateRequestOffer } from '@/features/requests/use-requests';
import { t } from '@/lib/i18n';

export function OfferForm({ requestId, businessId }: { requestId: string; businessId: string }) {
  const create = useCreateRequestOffer(requestId);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [locationText, setLocationText] = useState('');
  const [shippingIncluded, setShippingIncluded] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const amountMinor = Math.round(Number(amount.replace(',', '.')) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      setError('Geçerli bir tutar girin.');
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
        currency: DEFAULT_CURRENCY,
        locationText: locationText.trim(),
        shippingIncluded,
        note: note || undefined,
        validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      });
      setAmount('');
      setNote('');
      setLocationText('');
      setShippingIncluded(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Teklif gönderilemedi.');
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
      <Field label="Tutar (TL)" required>
        {(props) => (
          <Input {...props} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        )}
      </Field>
      <Field label={t('social.dealLocation')} required>
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
      <Field label="Not">
        {(props) => (
          <Textarea {...props} value={note} onChange={(e) => setNote(e.target.value)} rows={1} />
        )}
      </Field>
      <div className="flex items-end">
        <Button
          type="submit"
          className="bg-accent-500 text-white hover:bg-accent-600"
          disabled={create.isPending}
        >
          {t('social.giveOffer')}
        </Button>
      </div>
      {error ? <p className="text-sm text-danger-500 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
