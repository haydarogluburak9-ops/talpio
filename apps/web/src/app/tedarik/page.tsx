import type { Metadata } from 'next';
import Link from 'next/link';

import { CommerceRequestForm } from '@/features/requests/commerce-request-form';
import { OilRequestForm } from '@/features/requests/oil-request-form';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('commerce.createTitle'),
  description: t('commerce.createDescription'),
};

type SearchParams = Promise<{ tip?: string; magaza?: string }>;

export default async function TedarikPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const oilMode = params.tip === 'yag' || params.tip === 'oil';
  const storeUsername = params.magaza?.trim() || undefined;

  return (
    <SocialShell showRail={false}>
      <div className="social-panel mb-4 p-5 sm:p-6">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
          Tal<span className="text-brand-800 dark:text-brand-200">pio</span>
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
          {t('commerce.createTitle')}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-foreground-muted">
          {t('commerce.createDescription')}
        </p>
        <p className="mt-3 text-sm text-foreground-muted">
          {oilMode ? (
            <>
              Madeni yağ formu.{' '}
              <Link href="/tedarik" className="font-medium text-accent-600 hover:underline">
                Genel tedarik formuna dön
              </Link>
            </>
          ) : (
            <>
              Genel form.{' '}
              <Link href="/tedarik?tip=yag" className="font-medium text-accent-600 hover:underline">
                Madeni yağ özel formu
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="social-panel p-5 sm:p-6">
        {oilMode ? <OilRequestForm /> : <CommerceRequestForm storeUsername={storeUsername} />}
      </div>
    </SocialShell>
  );
}
