import type { Metadata } from 'next';

import { PaymentHistory } from '@/features/payments/payment-history';
import { SocialShell } from '@/features/social/social-shell';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('payments.pageTitle'),
  robots: { index: false, follow: false },
};

export default function PaymentsPage() {
  if (!publicEnv.featurePayments) {
    return (
      <SocialShell showRail={false}>
        <div className="social-panel p-5 sm:p-6">
          <h1 className="font-display text-2xl text-foreground">{t('payments.pageTitle')}</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            {t('payments.featureOff')}
          </p>
        </div>
      </SocialShell>
    );
  }

  return (
    <SocialShell showRail={false}>
      <div className="social-panel mb-4 p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('payments.pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('payments.pageSubtitle')}</p>
      </div>
      <div className="social-panel p-5 sm:p-6">
        <PaymentHistory />
      </div>
    </SocialShell>
  );
}