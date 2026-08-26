import type { Metadata } from 'next';

import { CommerceRequestForm } from '@/features/requests/commerce-request-form';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('commerce.createTitle', { descriptionKey: 'commerce.createDescription' });
}

/** Dikeye özel form yerine artık genel form açılır; kategori hazır seçilir. */
const CATEGORY_SHORTCUTS: Record<string, string> = {
  yag: 'madeni-yag-kimya',
  oil: 'madeni-yag-kimya',
};

type SearchParams = Promise<{ tip?: string; magaza?: string }>;

export default async function TedarikPage({ searchParams }: { searchParams: SearchParams }) {
  await applyRequestLocale();
  const params = await searchParams;
  const initialCategorySlug = params.tip ? CATEGORY_SHORTCUTS[params.tip] : undefined;
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
        <p className="mt-3 max-w-xl text-sm text-foreground-muted">
          {t('commerce.attributeSectionHint')}
        </p>
      </div>
      <div className="social-panel p-5 sm:p-6">
        <CommerceRequestForm
          storeUsername={storeUsername}
          initialCategorySlug={initialCategorySlug}
        />
      </div>
    </SocialShell>
  );
}
