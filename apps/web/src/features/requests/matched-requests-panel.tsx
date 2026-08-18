'use client';

import { ApiError } from '@talpio/api-client';
import { DEFAULT_CURRENCY } from '@talpio/config';
import { Button, Field, Input, ListSkeleton, Textarea } from '@talpio/ui';
import Link from 'next/link';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import {
  useCreateRequestOffer,
  useMatchedRequests,
  useMyBusinesses,
} from './use-requests';

export function MatchedRequestsPanel() {
  const matched = useMatchedRequests();
  const businesses = useMyBusinesses();

  if (matched.isPending) return <ListSkeleton rows={3} />;

  if (matched.isError) {
    return (
      <div className="social-panel p-5">
        <p className="text-sm text-foreground-muted">
          Eşleşen talepler yüklenemedi.{' '}
          <button type="button" className="underline" onClick={() => void matched.refetch()}>
            Tekrar dene
          </button>
        </p>
      </div>
    );
  }

  const items = matched.data?.items ?? [];
  const businessList = (businesses.data as Array<{ id: string; name: string }> | undefined) ?? [];

  if (items.length === 0) {
    return (
      <div className="social-panel p-5">
        <p className="text-sm text-foreground-muted">
          Henüz eşleşen tedarik talebi yok. Tedarikçi işletmenizi oluşturduğunuzdan emin olun.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 pb-20 lg:pb-6">
      {items.map((request) => (
        <li key={request.id} className="social-panel p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="rounded-md bg-accent-500 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
                {t('social.requestBadge')}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold text-brand-900 dark:text-foreground">
                {request.title}
              </h3>
              {request.matchScore != null ? (
                <p className="mt-1 text-xs font-semibold text-accent-600">
                  {t('match.score', { score: request.matchScore })}
                </p>
              ) : null}
              {request.matchReasons && request.matchReasons.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-foreground-muted">
                  {request.matchReasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-1 text-sm text-foreground-muted">{request.description}</p>
              {request.deliveryAddressText || request.deliveryCityId ? (
                <p className="mt-1 text-xs text-foreground-muted">
                  {t('social.dealLocation')}:{' '}
                  {request.deliveryAddressText ?? request.deliveryCityId}
                </p>
              ) : null}
            </div>
            <Link
              href={`/tedarik/${request.id}`}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              Detay
            </Link>
          </div>
          {businessList[0] ? (
            <OfferForm requestId={request.id} businessId={businessList[0].id} />
          ) : (
            <p className="text-sm text-foreground-muted">Teklif için önce işletme kaydı gerekir.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function OfferForm({ requestId, businessId }: { requestId: string; businessId: string }) {
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
