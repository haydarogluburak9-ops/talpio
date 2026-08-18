import type { Metadata } from 'next';

import { CategoryGrid } from '@/features/catalog/category-grid';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.categories'),
  description: t('home.categoriesHint'),
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <SocialShell showRail={false}>
      <div className="social-panel mb-4 p-5 sm:p-6">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
          Tal<span className="text-brand-800 dark:text-brand-200">pio</span>
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
          {t('nav.categories')}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-foreground-muted text-balance-safe">
          {t('home.categoriesHint')}
        </p>
      </div>
      <div className="social-panel p-5 sm:p-6">
        <CategoryGrid searchable initialQuery={q ?? ''} />
      </div>
    </SocialShell>
  );
}
