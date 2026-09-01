import { formatMoneyMinor } from '@talpio/localization';
import type { RequestOffer } from '@talpio/types';

import { getLocale, t } from '@/lib/i18n';

export function OfferSummary({ offer }: { offer: RequestOffer }) {
  const shipping =
    offer.shippingIncluded == null
      ? '—'
      : offer.shippingIncluded
        ? t('social.shippingIncludedYes')
        : t('social.shippingIncludedNo');

  const rows: Array<{ label: string; value: string; emphasize?: boolean }> = [
    {
      label: t('commerce.amount'),
      value: formatMoneyMinor(offer.amountMinor, offer.currency, getLocale()),
      emphasize: true,
    },
    {
      label: t('commerce.delivery'),
      value:
        offer.deliveryDays != null
          ? t('offer.validityDaysValue', { count: offer.deliveryDays })
          : '—',
    },
    { label: t('commerce.shipping'), value: shipping },
    { label: t('commerce.location'), value: offer.locationText?.trim() || '—' },
    { label: t('commerce.contents'), value: offer.note?.trim() || '—' },
  ];

  return (
    <dl className="grid gap-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-0.5 sm:grid-cols-[8.5rem_1fr] sm:gap-3">
          <dt className="text-xs font-medium text-foreground-muted">{row.label}</dt>
          <dd
            className={
              row.emphasize
                ? 'font-semibold text-accent-600'
                : 'whitespace-pre-wrap text-foreground'
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
