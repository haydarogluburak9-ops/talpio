import { buttonVariants, cn } from '@talpio/ui';
import Link from 'next/link';

import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

import { CategoryDetail } from './category-detail';

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <SocialShell showRail={false}>
      <div className="social-panel p-5 sm:p-6">
        <CategoryDetail slug={slug} />

        <div className="mt-10 flex flex-col items-start gap-4 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-foreground-muted text-balance-safe">
            {t('home.howItWorksHint')}
          </p>
          <Link
            href="/nasil-calisir"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-accent-500 font-semibold tracking-wide text-white hover:bg-accent-600',
            )}
          >
            {t('nav.howItWorks')}
          </Link>
        </div>
      </div>
    </SocialShell>
  );
}
