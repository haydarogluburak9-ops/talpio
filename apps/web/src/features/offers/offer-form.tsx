'use client';

import { ApiError } from '@talpio/api-client';
import { minorUnitFactor } from '@talpio/config';
import { Button, Field, Input, Textarea } from '@talpio/ui';
import { useEffect, useId, useState } from 'react';

import { CurrencySelect } from '@/features/currency/currency-select';
import { useMyCurrency } from '@/features/currency/use-currency';
import { useCreateRequestOffer } from '@/features/requests/use-requests';
import { t } from '@/lib/i18n';

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
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function syncHash() {
      if (window.location.hash === '#teklif-ver') setOpen(true);
    }
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  return (
    <div>
      <p className="text-sm text-foreground-muted">{t('offer.formHint')}</p>
      <Button
        type="button"
        className="mt-3 bg-accent-500 text-white hover:bg-accent-600"
        onClick={() => setOpen(true)}
      >
        {t('offer.openForm')}
      </Button>
      {sent ? <p className="mt-2 text-sm text-foreground-muted">{t('offer.submitted')}</p> : null}
      {open ? (
        <OfferFormDialog
          requestId={requestId}
          businessId={businessId}
          request={request}
          onClose={() => setOpen(false)}
          onSent={() => {
            setSent(true);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function OfferFormDialog({
  requestId,
  businessId,
  request,
  onClose,
  onSent,
}: {
  requestId: string;
  businessId: string;
  request?: OfferFormRequest;
  onClose: () => void;
  onSent: () => void;
}) {
  const create = useCreateRequestOffer(requestId);
  const defaultCurrency = useMyCurrency();
  const titleId = useId();
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const currency = currencyOverride ?? defaultCurrency;
  const [amount, setAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [note, setNote] = useState('');
  const [locationText, setLocationText] = useState(request?.deliveryAddressText ?? '');
  const [shippingIncluded, setShippingIncluded] = useState<boolean | null>(null);
  const [validityDays, setValidityDays] = useState<(typeof VALIDITY_DAYS)[number]>(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

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

    if (note.trim().length < NOTE_MIN) {
      setError(t('offer.contentsRequired'));
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
        validUntil: new Date(Date.now() + validityDays * 86_400_000).toISOString(),
      });
      onSent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('offer.submitFailed'));
    }
  }

  const qty =
    request?.quantity != null && request.quantity.trim()
      ? `${request.quantity}${request.unit ? ` ${request.unit}` : ''}`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-brand-900/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(e) => void submit(e)}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-soft sm:rounded-2xl"
      >
        <div className="overflow-y-auto p-5 sm:p-6">
          <h2
            id={titleId}
            className="font-display text-lg font-semibold text-brand-900 dark:text-foreground"
          >
            {t('offer.createTitle')}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">{t('offer.formHint')}</p>

          {request ? (
            <div className="mt-4 rounded-xl bg-surface-muted/70 px-4 py-3 ring-1 ring-border/70">
              <p className="text-xs font-medium text-foreground-muted">{t('offer.forRequest')}</p>
              <p className="mt-0.5 font-semibold text-foreground">{request.title}</p>
              {qty ? (
                <p className="mt-1 text-sm text-foreground">
                  {t('commerce.fieldQuantity')}: {qty}
                </p>
              ) : null}
              {request.description ? (
                <p className="mt-1 line-clamp-3 text-sm text-foreground-muted">
                  {request.description}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger-500">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-accent-500 text-white hover:bg-accent-600"
            disabled={create.isPending}
          >
            {create.isPending ? t('offer.submitting') : t('offer.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
