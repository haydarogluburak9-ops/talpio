'use client';

import { t } from '@/lib/i18n';

export default function DataProtectionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
        {t('nav.gdpr')}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">{t('legal.dataTitle')}</h1>
      <p className="mt-4 text-sm leading-relaxed text-foreground-muted">{t('legal.dataIntro')}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{t('legal.dataBody')}</p>
      <p className="mt-6 text-xs text-foreground-muted">{t('legal.disclaimer')}</p>
    </main>
  );
}
