import { formatMoneyMinor } from '@talpio/localization';
import type { OfferLetterhead, RequestOffer } from '@talpio/types';

import { getLocale, localeTag, t } from '@/lib/i18n';

export type OfferDocumentRequest = {
  title: string;
  quantity?: string | null;
  unit?: string | null;
};

export function offerNumber(offer: RequestOffer) {
  return `TK-${offer.id.replace(/-/g, '').slice(-8).toUpperCase()}`;
}

export function OfferDocument({
  offer,
  request,
}: {
  offer: RequestOffer;
  request?: OfferDocumentRequest | null;
}) {
  const head = offer.letterhead ?? {};
  const title = head.invoiceTitle?.trim() || t('offer.documentTitle');
  const legal = head.legalName?.trim() || offer.seller?.name || t('offer.sellerFallback');
  const money = formatMoneyMinor(offer.amountMinor, offer.currency, getLocale());
  const qty = request?.quantity
    ? `${request.quantity}${request.unit ? ` ${request.unit}` : ''}`
    : '—';

  return (
    <article className="bg-white text-neutral-900">
      <header className="flex items-start justify-between gap-4 border-b border-neutral-300 pb-4">
        <div className="flex items-start gap-3">
          {head.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={head.logoUrl} alt="" className="h-14 w-auto max-w-[8rem] object-contain" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-md bg-neutral-100 text-xs font-bold tracking-wide text-neutral-500">
              LOGO
            </div>
          )}
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-neutral-500">{title}</p>
            <p className="mt-1 text-lg font-semibold">{legal}</p>
            <LetterheadLines head={head} />
          </div>
        </div>
        <div className="text-right text-xs text-neutral-600">
          <p>
            {t('offer.documentNo')}: <span className="font-semibold">{offerNumber(offer)}</span>
          </p>
          <p>
            {t('offer.documentDate')}:{' '}
            {new Date(offer.submittedAt ?? offer.createdAt).toLocaleDateString(localeTag())}
          </p>
        </div>
      </header>

      {request ? (
        <p className="mt-4 text-sm">
          <span className="text-neutral-500">{t('offer.buyerRequest')}: </span>
          <span className="font-medium">{request.title}</span>
        </p>
      ) : null}

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-neutral-300 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="px-2 py-2">{t('offer.brand')}</th>
            <th className="px-2 py-2">{t('offer.model')}</th>
            <th className="px-2 py-2">{t('commerce.fieldQuantity')}</th>
            <th className="px-2 py-2">{t('commerce.delivery')}</th>
            <th className="px-2 py-2 text-right">{t('commerce.amount')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-200 align-top">
            <td className="px-2 py-3">{offer.brand?.trim() || '—'}</td>
            <td className="px-2 py-3">{offer.model?.trim() || '—'}</td>
            <td className="px-2 py-3">{qty}</td>
            <td className="px-2 py-3">
              {offer.deliveryDays != null
                ? t('offer.validityDaysValue', { count: offer.deliveryDays })
                : '—'}
            </td>
            <td className="px-2 py-3 text-right font-semibold">{money}</td>
          </tr>
        </tbody>
      </table>

      {offer.note ? <p className="mt-4 whitespace-pre-wrap text-sm">{offer.note}</p> : null}

      <dl className="mt-4 grid gap-1 text-sm text-neutral-700">
        <div>
          {t('commerce.shipping')}:{' '}
          {offer.shippingIncluded
            ? t('social.shippingIncludedYes')
            : t('social.shippingIncludedNo')}
        </div>
        {offer.locationText ? (
          <div>
            {t('commerce.location')}: {offer.locationText}
          </div>
        ) : null}
        <div>
          {t('offer.validity')}: {new Date(offer.validUntil).toLocaleDateString(localeTag())}
        </div>
      </dl>

      <footer className="mt-10 flex justify-end">
        <div className="w-48 border-t border-neutral-400 pt-2 text-center text-xs text-neutral-500">
          {t('offer.stamp')}
        </div>
      </footer>
    </article>
  );
}

function LetterheadLines({ head }: { head: OfferLetterhead }) {
  const lines = [head.taxOffice, head.taxId, head.address, head.phone].filter(Boolean);
  if (lines.length === 0) return null;
  return <p className="mt-1 text-xs leading-relaxed text-neutral-600">{lines.join(' · ')}</p>;
}

export function openOfferPdf(offer: RequestOffer, request?: OfferDocumentRequest | null) {
  const head = offer.letterhead ?? {};
  const title = head.invoiceTitle?.trim() || t('offer.documentTitle');
  const legal = escapeHtml(head.legalName?.trim() || offer.seller?.name || t('offer.sellerFallback'));
  const money = formatMoneyMinor(offer.amountMinor, offer.currency, getLocale());
  const qty = request?.quantity
    ? `${request.quantity}${request.unit ? ` ${request.unit}` : ''}`
    : '—';
  const logo = head.logoUrl
    ? `<img src="${escapeHtml(head.logoUrl)}" alt="" style="height:56px;max-width:128px;object-fit:contain" />`
    : `<div style="width:56px;height:56px;display:grid;place-items:center;background:#f4f4f5;color:#737373;font:700 11px sans-serif">LOGO</div>`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)} ${offerNumber(offer)}</title>
<style>
  body{font:14px/1.45 system-ui,sans-serif;color:#171717;margin:24px}
  header{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #d4d4d4;padding-bottom:16px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#737373;border-top:1px solid #d4d4d4;border-bottom:1px solid #d4d4d4;background:#fafafa;padding:8px}
  td{padding:12px 8px;border-bottom:1px solid #e5e5e5;vertical-align:top}
  .right{text-align:right}
  .meta{font-size:12px;color:#525252}
  footer{margin-top:48px;display:flex;justify-content:flex-end}
  .stamp{width:180px;border-top:1px solid #a3a3a3;padding-top:8px;text-align:center;font-size:12px;color:#737373}
  @media print{body{margin:12mm}}
</style></head><body>
<header>
  <div style="display:flex;gap:12px">
    ${logo}
    <div>
      <div style="font-size:11px;letter-spacing:.18em;font-weight:700;color:#737373">${escapeHtml(title)}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">${legal}</div>
      <div class="meta">${escapeHtml([head.taxOffice, head.taxId, head.address, head.phone].filter(Boolean).join(' · '))}</div>
    </div>
  </div>
  <div class="right meta">
    <div>${escapeHtml(t('offer.documentNo'))}: <b>${offerNumber(offer)}</b></div>
    <div>${escapeHtml(t('offer.documentDate'))}: ${new Date(offer.submittedAt ?? offer.createdAt).toLocaleDateString(localeTag())}</div>
  </div>
</header>
${
  request
    ? `<p><span class="meta">${escapeHtml(t('offer.buyerRequest'))}:</span> <b>${escapeHtml(request.title)}</b></p>`
    : ''
}
<table>
  <thead><tr>
    <th>${escapeHtml(t('offer.brand'))}</th>
    <th>${escapeHtml(t('offer.model'))}</th>
    <th>${escapeHtml(t('commerce.fieldQuantity'))}</th>
    <th>${escapeHtml(t('commerce.delivery'))}</th>
    <th class="right">${escapeHtml(t('commerce.amount'))}</th>
  </tr></thead>
  <tbody><tr>
    <td>${escapeHtml(offer.brand?.trim() || '—')}</td>
    <td>${escapeHtml(offer.model?.trim() || '—')}</td>
    <td>${escapeHtml(qty)}</td>
    <td>${escapeHtml(offer.deliveryDays != null ? t('offer.validityDaysValue', { count: offer.deliveryDays }) : '—')}</td>
    <td class="right"><b>${escapeHtml(money)}</b></td>
  </tr></tbody>
</table>
${offer.note ? `<p>${escapeHtml(offer.note)}</p>` : ''}
<p class="meta">
  ${escapeHtml(t('commerce.shipping'))}: ${escapeHtml(offer.shippingIncluded ? t('social.shippingIncludedYes') : t('social.shippingIncludedNo'))}<br/>
  ${offer.locationText ? `${escapeHtml(t('commerce.location'))}: ${escapeHtml(offer.locationText)}<br/>` : ''}
  ${escapeHtml(t('offer.validity'))}: ${new Date(offer.validUntil).toLocaleDateString(localeTag())}
</p>
<footer><div class="stamp">${escapeHtml(t('offer.stamp'))}</div></footer>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const popup = window.open('', '_blank');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
